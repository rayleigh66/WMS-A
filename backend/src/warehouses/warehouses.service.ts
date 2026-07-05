import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const wh = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { locations: { where: { deletedAt: null } } },
    });
    if (!wh) throw new NotFoundException("仓库不存在");
    return wh;
  }

  async create(dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { warehouseCode: dto.warehouseCode },
    });
    if (existing)
      throw new ConflictException(`仓库编码 ${dto.warehouseCode} 已存在`);
    return this.prisma.warehouse.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException("仓库不存在");
    return this.prisma.warehouse.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException("仓库不存在");
    return this.prisma.warehouse.update({
      where: { id },
      data: { status: "DISABLED", deletedAt: new Date() },
    });
  }
}
