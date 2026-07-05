import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';

@Injectable()
export class StockInService {
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
        orderBy: { createdAt: 'desc' },
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
    if (!order) throw new NotFoundException('入库单不存在');
    return order;
  }

  async create(dto: CreateStockInDto, operatorId: string) {
    // Validate items exist and are active
    const items = await this.prisma.item.findMany({
      where: { id: { in: dto.items.map((i) => i.itemId) }, status: 'ACTIVE', deletedAt: null },
    });
    if (items.length !== dto.items.length) {
      throw new BadRequestException('存在无效或已停用的物料');
    }

    // Validate warehouse
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse || warehouse.deletedAt) throw new NotFoundException('仓库不存在');

    // Validate locations
    for (const item of dto.items) {
      const location = await this.prisma.location.findUnique({ where: { id: item.locationId } });
      if (!location || location.deletedAt || location.warehouseId !== dto.warehouseId) {
        throw new BadRequestException(`库位 ${item.locationId} 无效或不属于该仓库`);
      }
      if (item.quantity <= 0) {
        throw new BadRequestException('数量必须大于0');
      }
    }

    // Generate order number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.stockInOrder.count({
      where: { orderNo: { startsWith: `IN-${dateStr}` } },
    });
    const orderNo = `IN-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Use transaction for consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // Create order
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
        // Update or create inventory balance
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

        // Create stock movement
        const movCount = await tx.stockMovement.count({
          where: { movementNo: { startsWith: `MOV-${dateStr}` } },
        });
        const movementNo = `MOV-${dateStr}-${String(movCount + 1).padStart(4, '0')}`;

        await tx.stockMovement.create({
          data: {
            movementNo,
            itemId: item.itemId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            movementType: 'STOCK_IN',
            quantityChange: item.quantity,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            sourceType: 'STOCK_IN_ORDER',
            sourceId: order.id,
            operatorId,
            remark: `入库(${dto.type}): ${item.remark || ''}`,
          },
        });
      }

      return order;
    });

    // Log operation
    await this.operationLogsService.log({
      userId: operatorId,
      action: '创建入库单',
      entityType: 'StockInOrder',
      entityId: result.id,
      detail: `创建入库单 ${orderNo}，${dto.items.length} 条明细`,
    });

    return this.findOne(result.id);
  }
}
