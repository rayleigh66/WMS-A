import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    detail?: string;
    ip?: string;
    userAgent?: string;
  }) {
    // Fire and forget - don't block the main operation
    try {
      await this.prisma.operationLog.create({ data: params as any });
    } catch (e) {
      // Log silently - operation logs should never break business operations
    }
  }

  async findAll(params: { page?: number; pageSize?: number; action?: string; entityType?: string }) {
    const { page = 1, pageSize = 20, action, entityType } = params;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;

    const [data, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        skip, take: pageSize, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}
