import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/authenticated-user.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersEventsService } from './orders-events.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

const jwt = require('jsonwebtoken');

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersEventsService: OrdersEventsService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return await this.ordersService.create(user?.sub, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return await this.ordersService.findMine(user.sub);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin')
  async findAll() {
    return await this.ordersService.findAll();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return await this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }

  @Sse('admin/stream')
  adminStream(@Query('token') token: string): Observable<MessageEvent> {
    this.verifyStreamToken(token, ['admin', 'superadmin']);
    return this.ordersEventsService.createAdminStream();
  }

  @Sse('me/stream')
  myOrdersStream(@Query('token') token: string): Observable<MessageEvent> {
    const user = this.verifyStreamToken(token);
    return this.ordersEventsService.createUserStream(user.sub);
  }

  private verifyStreamToken(
    token: string | undefined,
    allowedRoles?: string[],
  ): AuthenticatedUser {
    if (!token?.trim()) {
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
        throw new UnauthorizedException("Ushbu oqim uchun access token talab qilinadi");
      }

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        throw new UnauthorizedException("Ushbu oqimga ulanish uchun ruxsat yo'q");
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        "Autentifikatsiya tokeni noto'g'ri yoki muddati tugagan",
      );
    }
  }
}
