import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockInService } from './stock-in.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Stock In')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stock-in')
export class StockInController {
  constructor(private stockInService: StockInService) {}

  @Get()
  @ApiOperation({ summary: '获取入库单列表' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.stockInService.findAll({ page: Number(page ?? 1), pageSize: Number(pageSize ?? 20) });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取入库单详情' })
  findOne(@Param('id') id: string) {
    return this.stockInService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: '创建入库单' })
  create(@Body() dto: CreateStockInDto, @CurrentUser() user: any) {
    return this.stockInService.create(dto, user.id);
  }
}
