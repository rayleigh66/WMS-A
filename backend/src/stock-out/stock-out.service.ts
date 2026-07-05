import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OperationLogsService } from "../operation-logs/operation-logs.service";
import { CreateStockOutDto } from "./dto/create-stock-out.dto";

@Injectable()
export class StockOutService {
  constructor(
    private prisma: PrismaService,
    private operationLogsService: OperationLogsService,
  ) {}

  async findAll(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.stockOutOrder.findMany({
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
      this.prisma.stockOutOrder.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const order = await this.prisma.stockOutOrder.findUnique({
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
    if (!order) throw new NotFoundException("出库单不存在");
    return order;
  }

  async create(dto: CreateStockOutDto, operatorId: string) {
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: dto.items.map((i) => i.itemId) },
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    if (items.length !== dto.items.length)
      throw new BadRequestException("存在无效或已停用的物料");

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.deletedAt)
      throw new NotFoundException("仓库不存在");

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await this.prisma.stockOutOrder.count({
      where: { orderNo: { startsWith: `OUT-${dateStr}` } },
    });
    const orderNo = `OUT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Check stock availability first
    for (const item of dto.items) {
      const balance = await this.prisma.inventoryBalance.findUnique({
        where: {
          itemId_warehouseId_locationId: {
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
          },
        },
      });
      const available = balance ? Number(balance.quantity) : 0;
      if (available < item.quantity) {
        throw new BadRequestException({
          message: "库存不足",
          itemId: item.itemId,
          availableQuantity: String(available),
          requestedQuantity: String(item.quantity),
        });
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.stockOutOrder.create({
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
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            itemId_warehouseId_locationId: {
              itemId: item.itemId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
            },
          },
        });
        const qtyBefore = balance ? Number(balance.quantity) : 0;

        await tx.inventoryBalance.update({
          where: {
            itemId_warehouseId_locationId: {
              itemId: item.itemId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        const qtyAfter = qtyBefore - Number(item.quantity);
        const movCount = await tx.stockMovement.count({
          where: { movementNo: { startsWith: `MOV-${dateStr}` } },
        });
        const movementNo = `MOV-${dateStr}-${String(movCount + 1).padStart(4, "0")}`;
        await tx.stockMovement.create({
          data: {
            movementNo,
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            movementType: "STOCK_OUT",
            quantityChange: -Number(item.quantity),
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            sourceType: "STOCK_OUT_ORDER",
            sourceId: order.id,
            operatorId,
            remark: `出库(${dto.type}): ${item.remark || ""}`,
          },
        });
      }

      return order;
    });

    await this.operationLogsService.log({
      userId: operatorId,
      action: "创建出库单",
      entityType: "StockOutOrder",
      entityId: result.id,
      detail: `创建出库单 ${orderNo}，${dto.items.length} 条明细`,
    });

    return this.findOne(result.id);
  }
}
