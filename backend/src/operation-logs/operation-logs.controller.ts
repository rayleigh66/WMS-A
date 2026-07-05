import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperationLogsService } from './operation-logs.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Operation Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('api/operation-logs')
export class OperationLogsController {
  constructor(private operationLogsService: OperationLogsService) {}

  @Get()
  @ApiOperation({ summary: '获取操作日志列表' })
  findAll(
    @Query('page') page?: string, @Query('pageSize') pageSize?: string,
    @Query('action') action?: string, @Query('entityType') entityType?: string,
  ) {
    return this.operationLogsService.findAll({
      page: +page || 1, pageSize: +pageSize || 20, action, entityType,
    });
  }
}
