import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard, PublicRoute } from "../common/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";

@ApiTags("Auth")
@Controller("api/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @PublicRoute()
  @Post("login")
  @ApiOperation({ summary: "用户登录" })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    try {
      const result = await this.authService.login(
        dto.email,
        dto.password,
        req.ip,
        req.headers["user-agent"],
      );
      return result;
    } catch (e: any) {
      throw new (require("@nestjs/common").UnauthorizedException)(e.message);
    }
  }

  @PublicRoute()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "用户登出" })
  logout() {
    return { message: "登出成功" };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "获取当前用户信息" })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }
}
