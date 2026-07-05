import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockMovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number; pageSize?: number;
    itemId?: string; warehouseId?: string; locationId?: string;
    movementType?: string; sourceType?: string;
    dateFrom?: string; dateTo?: string;
  }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (params.itemId) where.itemId = params.itemId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.locationId) where.locationId = params.locationId;
    if (params.movementType) where.movementType = params.movementType;
    if (params.sourceType) where.sourceType = params.sourceType;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          item: { select: { itemCode: true, itemName: true } },
          warehouse: { select: { warehouseCode: true, warehouseName: true } },
          location: { select: { locationCode: true, locationName: true } },
          operator: { select: { name: true } },
        },
        skip, take: pageSize, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        item: true, warehouse: true, location: true, operator: { select: { name: true } },
      },
    });
  }
}
