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
import { StockOutService } from "./stock-out.service";
import { CreateStockOutDto } from "./dto/create-stock-out.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { CurrentUser } from "../common/current-user.decorator";
import { Role } from "@prisma/client";

@ApiTags("Stock Out")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/stock-out")
export class StockOutController {
  constructor(private stockOutService: StockOutService) {}

  @Get()
  @ApiOperation({ summary: "获取出库单列表" })
  findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.stockOutService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取出库单详情" })
  findOne(@Param("id") id: string) {
    return this.stockOutService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: "创建出库单" })
  create(@Body() dto: CreateStockOutDto, @CurrentUser() user: any) {
    return this.stockOutService.create(dto, user.id);
  }
}
