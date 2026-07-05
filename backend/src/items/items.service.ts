import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; pageSize?: number; search?: string; category?: string; status?: string }) {
    const { page = 1, pageSize = 20, search, category, status } = params;
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { itemCode: { contains: search } },
        { itemName: { contains: search } },
        { specification: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({ where, skip, take: pageSize, orderBy: { updatedAt: 'desc' } }),
      this.prisma.item.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('物料不存在');
    return item;
  }

  async findByCode(code: string) {
    return this.prisma.item.findUnique({ where: { itemCode: code } });
  }

  async create(dto: CreateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { itemCode: dto.itemCode } });
    if (existing) throw new ConflictException(`物料编码 ${dto.itemCode} 已存在`);
    return this.prisma.item.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('物料不存在');
    if (dto.itemCode && dto.itemCode !== item.itemCode) {
      const dup = await this.prisma.item.findUnique({ where: { itemCode: dto.itemCode } });
      if (dup) throw new ConflictException(`物料编码 ${dto.itemCode} 已存在`);
    }
    return this.prisma.item.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('物料不存在');
    // check if there are any inventory balances or movements
    const [invCount, movCount] = await Promise.all([
      this.prisma.inventoryBalance.count({ where: { itemId: id } }),
      this.prisma.stockMovement.count({ where: { itemId: id } }),
    ]);
    if (invCount > 0 || movCount > 0) {
      // soft delete / disable
      return this.prisma.item.update({ where: { id }, data: { status: 'DISABLED', deletedAt: new Date() } });
    }
    return this.prisma.item.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
