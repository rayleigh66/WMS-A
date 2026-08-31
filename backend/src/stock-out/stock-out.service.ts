import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OperationLogsService } from "../operation-logs/operation-logs.service";
import { CreateStockOutDto } from "./dto/create-stock-out.dto";

@Injectable()
export class StockOutService {
  private readonly logger = new Logger(StockOutService.name);

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
          items: { include: { item: { select: { itemCode: true, itemName: true, unit: true } }, location: { select: { locationCode: true, locationName: true } } } },
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
        items: { include: { item: { select: { itemCode: true, itemName: true, unit: true } }, location: { select: { locationCode: true, locationName: true } } } },
      },
    });
    if (!order) throw new NotFoundException("出库单不存在");
    return order;
  }

  private async findExistingRequest(requestId: string | undefined, operatorId: string) {
    if (!requestId) return null;
    const existing = await this.prisma.stockOutOrder.findUnique({ where: { requestId } });
    if (!existing) return null;
    if (existing.operatorId !== operatorId) throw new BadRequestException("请求标识已被其他操作占用");
    return this.findOne(existing.id);
  }

  async create(dto: CreateStockOutDto, operatorId: string) {
    const replay = await this.findExistingRequest(dto.requestId, operatorId);
    if (replay) return replay;

    const uniqueItemIds = [...new Set(dto.items.map((i) => i.itemId))];
    const items = await this.prisma.item.findMany({ where: { id: { in: uniqueItemIds }, status: "ACTIVE", deletedAt: null } });
    if (items.length !== uniqueItemIds.length) throw new BadRequestException("存在无效或已停用的物料");

    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse || warehouse.deletedAt) throw new NotFoundException("仓库不存在");

    const locationIds = [...new Set(dto.items.map((i) => i.locationId))];
    const locations = await this.prisma.location.findMany({ where: { id: { in: locationIds }, deletedAt: null }, select: { id: true, warehouseId: true, status: true } });
    if (locations.length !== locationIds.length || locations.some((location) => location.warehouseId !== dto.warehouseId || location.status !== "ACTIVE")) {
      throw new BadRequestException("存在无效、停用或不属于当前仓库的库位");
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const orderNo = `OUT-${dateStr}-${suffix}`;

    let result: { id: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const order = await tx.stockOutOrder.create({
          data: {
            orderNo,
            requestId: dto.requestId,
            type: dto.type,
            warehouseId: dto.warehouseId,
            operatorId,
            remark: dto.remark,
            items: { create: dto.items.map((i) => ({ itemId: i.itemId, locationId: i.locationId, quantity: i.quantity, unit: i.unit, remark: i.remark })) },
          },
        });

        for (const item of dto.items) {
          const balanceBefore = await tx.inventoryBalance.findUnique({ where: { itemId_warehouseId_locationId: { itemId: item.itemId, warehouseId: dto.warehouseId, locationId: item.locationId } } });
          const qtyBefore = balanceBefore ? Number(balanceBefore.quantity) : 0;
          const updated = await tx.inventoryBalance.updateMany({
            where: { itemId: item.itemId, warehouseId: dto.warehouseId, locationId: item.locationId, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } },
          });
          if (updated.count !== 1) {
            throw new BadRequestException({ message: "库存不足或库存已被其他操作占用", itemId: item.itemId, availableQuantity: String(qtyBefore), requestedQuantity: String(item.quantity) });
          }
          const balanceAfter = await tx.inventoryBalance.findUnique({ where: { itemId_warehouseId_locationId: { itemId: item.itemId, warehouseId: dto.warehouseId, locationId: item.locationId } } });
          const qtyAfter = balanceAfter ? Number(balanceAfter.quantity) : 0;
          await tx.stockMovement.create({
            data: {
              movementNo: `MOV-${dateStr}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
        return { id: order.id };
      });
    } catch (error: any) {
      if (dto.requestId && error?.code === "P2002") {
        const existing = await this.findExistingRequest(dto.requestId, operatorId);
        if (existing) return existing;
      }
      throw error;
    }

    try {
      await this.operationLogsService.log({ userId: operatorId, action: "创建出库单", entityType: "StockOutOrder", entityId: result.id, detail: `创建出库单 ${orderNo}，${dto.items.length} 条明细` });
    } catch (error) {
      this.logger.error(`出库已成功但操作日志写入失败: ${result.id}`, error as any);
    }
    return this.findOne(result.id);
  }
}
