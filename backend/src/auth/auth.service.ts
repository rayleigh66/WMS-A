import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private operationLogsService: OperationLogsService,
  ) {}

  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('账号或密码错误');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('账号或密码错误');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    await this.operationLogsService.log({
      userId: user.id,
      action: '登录',
      entityType: 'User',
      entityId: user.id,
      detail: `用户 ${user.name} 登录系统`,
      ip,
      userAgent,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, department: true, status: true, createdAt: true },
    });
    return user;
  }
}
