import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ItemsService } from "./items.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { CurrentUser } from "../common/current-user.decorator";
import { OperationLogsService } from "../operation-logs/operation-logs.service";
import { Role } from "@prisma/client";

@ApiTags("Items")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/items")
export class ItemsController {
  constructor(
    private itemsService: ItemsService,
    private operationLogsService: OperationLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取物料列表" })
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("status") status?: string,
  ) {
    return this.itemsService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
      search,
      category,
      status,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个物料" })
  findOne(@Param("id") id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: "创建物料" })
  async create(@Body() dto: CreateItemDto, @CurrentUser() user: any) {
    const result = await this.itemsService.create(dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: "创建物料",
      entityType: "Item",
      entityId: result.id,
      detail: `创建物料 ${result.itemCode} - ${result.itemName}`,
    });
    return result;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: "更新物料" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.itemsService.update(id, dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: "修改物料",
      entityType: "Item",
      entityId: id,
      detail: `修改物料 ${result.itemCode}`,
    });
    return result;
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "删除/停用物料" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    await this.itemsService.remove(id);
    await this.operationLogsService.log({
      userId: user.id,
      action: "停用物料",
      entityType: "Item",
      entityId: id,
      detail: "停用/删除物料",
    });
    return { message: "操作成功" };
  }
}
