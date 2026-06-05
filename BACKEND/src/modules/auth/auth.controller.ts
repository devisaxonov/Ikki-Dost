import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/authenticated-user.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { buildAuditRequestContext } from '../audit/audit.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    return await this.authService.register(
      registerDto,
      buildAuditRequestContext(request, {
        metadata: {
          email: registerDto.email,
        },
      }),
    );
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return await this.authService.login(
      loginDto,
      buildAuditRequestContext(request, {
        metadata: {
          email: loginDto.email,
        },
      }),
    );
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('admin/login')
  async loginAdmin(@Body() loginDto: LoginDto, @Req() request: Request) {
    return await this.authService.loginAdmin(
      loginDto,
      buildAuditRequestContext(request, {
        metadata: {
          email: loginDto.email,
        },
      }),
    );
  }

  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ) {
    return await this.authService.refresh(
      refreshTokenDto,
      buildAuditRequestContext(request),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return await this.authService.logout(
      user.sub,
      buildAuditRequestContext(request, {
        userId: user.sub,
      }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return await this.authService.me(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return await this.authService.updateProfile(
      user.sub,
      updateProfileDto,
      buildAuditRequestContext(request, {
        userId: user.sub,
      }),
    );
  }
}
