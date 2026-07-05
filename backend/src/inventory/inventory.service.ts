import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    warehouseId?: string;
    locationId?: string;
    lowStock?: string;
  }) {
    const { page = 1, pageSize = 20, search, category, warehouseId, locationId, lowStock } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { quantity: { gt: 0 } };

    if (warehouseId) where.warehouseId = warehouseId;
    if (locationId) where.locationId = locationId;

    const itemWhere: any = { deletedAt: null };
    if (search) {
      itemWhere.OR = [
        { itemCode: { contains: search } },
        { itemName: { contains: search } },
      ];
    }
    if (category) itemWhere.category = category;
    if (Object.keys(itemWhere).length > 0) where.item = itemWhere;

    if (lowStock === 'true') {
      // Items where quantity < safety_stock
      where.item = { ...itemWhere, safetyStock: { gt: 0 } };
      // We'll filter in-memory since Prisma can't compare two fields directly
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryBalance.findMany({
        where,
        include: {
          item: { select: { itemCode: true, itemName: true, category: true, specification: true, color: true, unit: true, safetyStock: true, status: true } },
          warehouse: { select: { warehouseCode: true, warehouseName: true } },
          location: { select: { locationCode: true, locationName: true } },
        },
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventoryBalance.count({ where }),
    ]);

    let result = data.map((d) => ({
      id: d.id,
      itemId: d.itemId,
      itemCode: d.item.itemCode,
      itemName: d.item.itemName,
      category: d.item.category,
      specification: d.item.specification,
      color: d.item.color,
      unit: d.item.unit,
      safetyStock: d.item.safetyStock,
      itemStatus: d.item.status,
      warehouseId: d.warehouseId,
      warehouseCode: d.warehouse.warehouseCode,
      warehouseName: d.warehouse.warehouseName,
      locationId: d.locationId,
      locationCode: d.location.locationCode,
      locationName: d.location.locationName,
      quantity: d.quantity,
      updatedAt: d.updatedAt,
    }));

    if (lowStock === 'true') {
      result = result.filter((r) => r.quantity < r.safetyStock);
    }

    return {
      data: result.slice(0, pageSize),
      total: lowStock === 'true' ? result.length : total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const balance = await this.prisma.inventoryBalance.findUnique({
      where: { id },
      include: {
        item: true,
        warehouse: true,
        location: true,
      },
    });
    return balance;
  }
}
