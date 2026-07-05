import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  async check() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
