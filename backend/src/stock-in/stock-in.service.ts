import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OperationLogsService } from "../operation-logs/operation-logs.service";
import { CreateStockInDto } from "./dto/create-stock-in.dto";

@Injectable()
export class StockInService {
  private readonly logger = new Logger(StockInService.name);

  constructor(
    private prisma: PrismaService,
    private operationLogsService: OperationLogsService,
  ) {}

  async findAll(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.stockInOrder.findMany({
        where: {},
        include: {
          warehouse: { select: { warehouseCode: true, warehouseName: true } },
          operator: { select: { name: true } },
          items: {
            include: {
              item: { select: { itemCode: true, itemName: true, unit: true } },
              location: { select: { locationCode: true, locationName: true } },
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.stockInOrder.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const order = await this.prisma.stockInOrder.findUnique({
      where: { id },
      include: {
        warehouse: { select: { warehouseCode: true, warehouseName: true } },
        operator: { select: { name: true } },
        items: {
          include: {
            item: { select: { itemCode: true, itemName: true, unit: true } },
            location: { select: { locationCode: true, locationName: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException("入库单不存在");
    return order;
  }

  async create(dto: CreateStockInDto, operatorId: string) {
    const uniqueItemIds = [...new Set(dto.items.map((i) => i.itemId))];
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: uniqueItemIds },
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    if (items.length !== uniqueItemIds.length) {
      throw new BadRequestException("存在无效或已停用的物料");
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.deletedAt)
      throw new NotFoundException("仓库不存在");

    const locationIds = [...new Set(dto.items.map((i) => i.locationId))];
    const locations = await this.prisma.location.findMany({
      where: { id: { in: locationIds }, deletedAt: null },
      select: { id: true, warehouseId: true, status: true },
    });
    if (
      locations.length !== locationIds.length ||
      locations.some((location) => location.warehouseId !== dto.warehouseId || location.status !== "ACTIVE")
    ) {
      throw new BadRequestException("存在无效、停用或不属于当前仓库的库位");
    }

    for (const item of dto.items) {
      if (item.quantity <= 0) throw new BadRequestException("数量必须大于0");
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const orderNo = `IN-${dateStr}-${suffix}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.stockInOrder.create({
        data: {
          orderNo,
          type: dto.type,
          warehouseId: dto.warehouseId,
          operatorId,
          remark: dto.remark,
          items: {
            create: dto.items.map((i) => ({
              itemId: i.itemId,
              locationId: i.locationId,
              quantity: i.quantity,
              unit: i.unit,
              remark: i.remark,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of dto.items) {
        const balance = await tx.inventoryBalance.upsert({
          where: {
            itemId_warehouseId_locationId: {
              itemId: item.itemId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            quantity: item.quantity,
          },
        });

        const qtyBefore = Number(balance.quantity) - Number(item.quantity);
        const qtyAfter = Number(balance.quantity);
        const movementNo = `MOV-${dateStr}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        await tx.stockMovement.create({
          data: {
            movementNo,
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            movementType: "STOCK_IN",
            quantityChange: item.quantity,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            sourceType: "STOCK_IN_ORDER",
            sourceId: order.id,
            operatorId,
            remark: `入库(${dto.type}): ${item.remark || ""}`,
          },
        });
      }

      return order;
    });

    try {
      await this.operationLogsService.log({
        userId: operatorId,
        action: "创建入库单",
        entityType: "StockInOrder",
        entityId: result.id,
        detail: `创建入库单 ${orderNo}，${dto.items.length} 条明细`,
      });
    } catch (error) {
      this.logger.error(`入库已成功但操作日志写入失败: ${result.id}`, error as any);
    }

    return this.findOne(result.id);
  }
}
