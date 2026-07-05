import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OperationLogsService } from "../operation-logs/operation-logs.service";
import { CreateStockAdjustmentDto } from "./dto/create-stock-adjustment.dto";

@Injectable()
export class StockAdjustmentsService {
  constructor(
    private prisma: PrismaService,
    private operationLogsService: OperationLogsService,
  ) {}

  async findAll(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
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
      this.prisma.stockAdjustment.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const adj = await this.prisma.stockAdjustment.findUnique({
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
    if (!adj) throw new NotFoundException("调整单不存在");
    return adj;
  }

  async create(dto: CreateStockAdjustmentDto, operatorId: string) {
    if (!dto.reason) throw new BadRequestException("必须填写调整原因");

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

    for (const item of dto.items) {
      if (item.quantityAfter < 0)
        throw new BadRequestException(`调整后数量不能为负数`);
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await this.prisma.stockAdjustment.count({
      where: { adjustmentNo: { startsWith: `ADJ-${dateStr}` } },
    });
    const adjustmentNo = `ADJ-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNo,
          warehouseId: dto.warehouseId,
          operatorId,
          reason: dto.reason,
          remark: dto.remark,
          items: {
            create: dto.items.map((i) => ({
              itemId: i.itemId,
              locationId: i.locationId,
              quantityBefore: 0,
              quantityAfter: i.quantityAfter,
              quantityChange: 0,
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
        const qtyAfter = Number(item.quantityAfter);
        const qtyChange = qtyAfter - qtyBefore;

        // Update inventory balance
        await tx.inventoryBalance.upsert({
          where: {
            itemId_warehouseId_locationId: {
              itemId: item.itemId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
            },
          },
          update: { quantity: qtyAfter },
          create: {
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            quantity: qtyAfter,
          },
        });

        // Update the adjustment item with actual before/after/change
        await tx.stockAdjustmentItem.update({
          where: {
            id: adjustment.items.find((ai) => ai.itemId === item.itemId)?.id,
          },
          data: { quantityBefore: qtyBefore, quantityChange: qtyChange },
        });

        // Create stock movement
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
            movementType: "ADJUSTMENT",
            quantityChange: qtyChange,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            sourceType: "STOCK_ADJUSTMENT",
            sourceId: adjustment.id,
            operatorId,
            remark: `调整: ${dto.reason}`,
          },
        });
      }

      return adjustment;
    });

    await this.operationLogsService.log({
      userId: operatorId,
      action: "创建库存调整",
      entityType: "StockAdjustment",
      entityId: result.id,
      detail: `创建调整单 ${adjustmentNo}，原因: ${dto.reason}`,
    });

    return this.findOne(result.id);
  }
}
