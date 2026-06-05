import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthenticatedUser } from '../authenticated-user.type';

const jwt = require('jsonwebtoken');

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true;
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        "Autentifikatsiya sarlavhasi noto'g'ri formatda yuborilgan",
      );
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException("Autentifikatsiya tokeni topilmadi");
    }

    const secret =
      this.configService.get<string>('JWT_SECRET') ?? process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException("JWT maxfiy kaliti sozlanmagan");
    }

    try {
      const payload = jwt.verify(token, secret) as AuthenticatedUser;

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException(
          "Autentifikatsiya tokeni noto'g'ri turda yuborilgan",
        );
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        "Autentifikatsiya tokeni noto'g'ri yoki muddati tugagan",
      );
    }
  }
}
