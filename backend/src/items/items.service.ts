import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    const { page = 1, pageSize = 20, search, category, status } = params;
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { itemCode: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search } },
        { itemName: { contains: search, mode: "insensitive" } },
        { specification: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.item.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException("物料不存在");
    return item;
  }

  async resolveScanCode(rawCode: string) {
    const code = decodeURIComponent(rawCode).trim();
    if (!code) throw new NotFoundException("条码为空");
    const item = await this.prisma.item.findFirst({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        OR: [
          { itemCode: { equals: code, mode: "insensitive" } },
          { barcode: code },
        ],
      },
    });
    if (!item) throw new NotFoundException(`未识别条码或SKU：${code}`);
    return item;
  }

  async findByCode(code: string) {
    return this.prisma.item.findUnique({ where: { itemCode: code } });
  }

  async create(dto: CreateItemDto) {
    const barcode = dto.barcode?.trim() || undefined;
    const existing = await this.prisma.item.findFirst({
      where: {
        OR: [
          { itemCode: dto.itemCode },
          ...(barcode ? [{ barcode }] : []),
        ],
      },
    });
    if (existing) throw new ConflictException("物料编码或条码已存在");
    return this.prisma.item.create({ data: { ...(dto as any), barcode } });
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("物料不存在");
    const barcode = (dto as any).barcode?.trim() || null;
    if (dto.itemCode !== undefined || (dto as any).barcode !== undefined) {
      const duplicate = await this.prisma.item.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.itemCode ? [{ itemCode: dto.itemCode }] : []),
            ...(barcode ? [{ barcode }] : []),
          ],
        },
      });
      if (duplicate) throw new ConflictException("物料编码或条码已存在");
    }
    return this.prisma.item.update({
      where: { id },
      data: { ...(dto as any), ...((dto as any).barcode !== undefined ? { barcode } : {}) },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("物料不存在");
    const [invCount, movCount] = await Promise.all([
      this.prisma.inventoryBalance.count({ where: { itemId: id } }),
      this.prisma.stockMovement.count({ where: { itemId: id } }),
    ]);
    if (invCount > 0 || movCount > 0) {
      return this.prisma.item.update({
        where: { id },
        data: { status: "DISABLED", deletedAt: new Date() },
      });
    }
    return this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
