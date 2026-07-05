import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StockMovementsService } from "./stock-movements.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@ApiTags("Stock Movements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/stock-movements")
export class StockMovementsController {
  constructor(private stockMovementsService: StockMovementsService) {}

  @Get()
  @ApiOperation({ summary: "获取库存流水列表" })
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("itemId") itemId?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("movementType") movementType?: string,
    @Query("sourceType") sourceType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.stockMovementsService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
      itemId,
      warehouseId,
      locationId,
      movementType,
      sourceType,
      dateFrom,
      dateTo,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单条流水" })
  findOne(@Param("id") id: string) {
    return this.stockMovementsService.findOne(id);
  }
}
