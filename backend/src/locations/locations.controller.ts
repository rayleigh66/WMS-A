import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { Role } from '@prisma/client';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/locations')
export class LocationsController {
  constructor(
    private locationsService: LocationsService,
    private operationLogsService: OperationLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取库位列表' })
  findAll(@Query('warehouseId') warehouseId?: string) {
    return this.locationsService.findAll({ warehouseId });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个库位' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建库位' })
  async create(@Body() dto: CreateLocationDto, @CurrentUser() user: any) {
    const result = await this.locationsService.create(dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: '创建库位',
      entityType: 'Location',
      entityId: result.id,
      detail: `创建库位 ${result.locationCode} - ${result.locationName}`,
    });
    return result;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新库位' })
  async update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @CurrentUser() user: any) {
    const result = await this.locationsService.update(id, dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: '修改库位',
      entityType: 'Location',
      entityId: id,
      detail: `修改库位 ${result.locationCode}`,
    });
    return result;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '删除库位（软删除）' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.locationsService.remove(id);
    await this.operationLogsService.log({
      userId: user.id,
      action: '删除库位',
      entityType: 'Location',
      entityId: id,
      detail: '删除库位',
    });
    return { message: '操作成功' };
  }
}
