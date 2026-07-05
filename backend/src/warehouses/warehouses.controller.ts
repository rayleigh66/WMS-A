import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { Role } from '@prisma/client';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/warehouses')
export class WarehousesController {
  constructor(
    private warehousesService: WarehousesService,
    private operationLogsService: OperationLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取仓库列表' })
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个仓库（含库位）' })
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建仓库' })
  async create(@Body() dto: CreateWarehouseDto, @CurrentUser() user: any) {
    const result = await this.warehousesService.create(dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: '创建仓库',
      entityType: 'Warehouse',
      entityId: result.id,
      detail: `创建仓库 ${result.warehouseCode} - ${result.warehouseName}`,
    });
    return result;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新仓库' })
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() user: any) {
    const result = await this.warehousesService.update(id, dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: '修改仓库',
      entityType: 'Warehouse',
      entityId: id,
      detail: `修改仓库 ${result.warehouseCode}`,
    });
    return result;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '删除仓库（软删除）' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.warehousesService.remove(id);
    await this.operationLogsService.log({
      userId: user.id,
      action: '删除仓库',
      entityType: 'Warehouse',
      entityId: id,
      detail: '删除仓库',
    });
    return { message: '操作成功' };
  }
}
