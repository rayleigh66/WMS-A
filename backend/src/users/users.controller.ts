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
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { Role } from "@prisma/client";
import { CurrentUser } from "../common/current-user.decorator";
import { OperationLogsService } from "../operation-logs/operation-logs.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller("api/users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    private operationLogsService: OperationLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取用户列表" })
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
  ) {
    return this.usersService.findAll({
      page: +page || 1,
      pageSize: +pageSize || 20,
      search,
      role,
      status,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个用户" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "创建用户" })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    const result = await this.usersService.create(dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: "创建用户",
      entityType: "User",
      entityId: result.id,
      detail: `创建用户 ${result.name} (${result.email})`,
    });
    return result;
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新用户" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.usersService.update(id, dto);
    await this.operationLogsService.log({
      userId: user.id,
      action: "修改用户",
      entityType: "User",
      entityId: id,
      detail: `修改用户 ${result.name}`,
    });
    return result;
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除用户（软删除）" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    await this.usersService.remove(id);
    await this.operationLogsService.log({
      userId: user.id,
      action: "删除用户",
      entityType: "User",
      entityId: id,
      detail: "软删除用户",
    });
    return { message: "删除成功" };
  }
}
