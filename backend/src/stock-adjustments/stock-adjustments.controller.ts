import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StockAdjustmentsService } from "./stock-adjustments.service";
import { CreateStockAdjustmentDto } from "./dto/create-stock-adjustment.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { CurrentUser } from "../common/current-user.decorator";
import { Role } from "@prisma/client";

@ApiTags("Stock Adjustments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/stock-adjustments")
export class StockAdjustmentsController {
  constructor(private stockAdjustmentsService: StockAdjustmentsService) {}

  @Get()
  @ApiOperation({ summary: "获取调整单列表" })
  findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.stockAdjustmentsService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取调整单详情" })
  findOne(@Param("id") id: string) {
    return this.stockAdjustmentsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: "创建库存调整单" })
  create(@Body() dto: CreateStockAdjustmentDto, @CurrentUser() user: any) {
    return this.stockAdjustmentsService.create(dto, user.id);
  }
}
