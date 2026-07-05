import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InventoryService } from "./inventory.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/inventory")
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: "获取库存列表" })
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("lowStock") lowStock?: string,
  ) {
    return this.inventoryService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
      search,
      category,
      warehouseId,
      locationId,
      lowStock,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个库存记录" })
  findOne(@Param("id") id: string) {
    return this.inventoryService.findOne(id);
  }
}
