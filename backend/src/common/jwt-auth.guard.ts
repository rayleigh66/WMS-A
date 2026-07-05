import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => Reflector?.createDecorator?.() ?? SetMetadata('isPublic', true);

import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC = 'isPublic';
export const PublicRoute = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('未登录');
    }
    return true;
  }
}
