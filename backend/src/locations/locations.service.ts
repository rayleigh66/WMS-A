import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { warehouseId?: string }) {
    const where: any = { deletedAt: null };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    return this.prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException("库位不存在");
    return loc;
  }

  async create(dto: CreateLocationDto) {
    const existing = await this.prisma.location.findUnique({
      where: {
        warehouseId_locationCode: {
          warehouseId: dto.warehouseId,
          locationCode: dto.locationCode,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        `该仓库下库位编码 ${dto.locationCode} 已存在`,
      );
    return this.prisma.location.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateLocationDto) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException("库位不存在");
    return this.prisma.location.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException("库位不存在");
    return this.prisma.location.update({
      where: { id },
      data: { status: "DISABLED", deletedAt: new Date() },
    });
  }
}
