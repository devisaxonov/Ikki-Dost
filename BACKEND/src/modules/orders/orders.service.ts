import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { OrdersEventsService } from './orders-events.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ordersEventsService: OrdersEventsService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(userId: number | undefined, createOrderDto: CreateOrderDto) {
    const user = await this.resolveCustomer(userId, createOrderDto);

    const quantityMap = new Map<string, number>();

    for (const item of createOrderDto.items) {
      quantityMap.set(
        item.foodId,
        (quantityMap.get(item.foodId) ?? 0) + item.quantity,
      );
    }

    const foodIds = Array.from(quantityMap.keys());

    const foods = await this.prismaService.food.findMany({
      where: {
        id: {
          in: foodIds,
        },
      },
    });

    if (foods.length !== foodIds.length) {
      throw new BadRequestException(
        "Tanlangan mahsulotlardan biri yoki bir nechtasi noto'g'ri",
      );
    }

    const itemsPayload = foods.map((food) => {
      const quantity = quantityMap.get(food.id) ?? 0;
      const totalPrice = Number((food.price * quantity).toFixed(2));

      return {
        foodId: food.id,
        name: food.name,
        category: food.category,
        image: food.image,
        unitPrice: food.price,
        quantity,
        totalPrice,
      };
    });

    const subtotal = Number(
      itemsPayload.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2),
    );
    const totalItems = itemsPayload.reduce((sum, item) => sum + item.quantity, 0);
    const fee = await this.settingsService.getDeliveryFee();
    const deliveryFee = subtotal === 0 ? 0 : fee;
    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const order = await this.prismaService.order.create({
      data: {
        userId: user.id,
        items: itemsPayload as Prisma.InputJsonValue,
        address: { ...createOrderDto.address } as unknown as Prisma.InputJsonValue,
        subtotal,
        deliveryFee,
        totalAmount,
        totalItems,
        status: 'Pending',
      },
    });
    this.ordersEventsService.emitOrderChange({
      event: 'created',
      orderId: order.id,
      userId: user.id,
      status: order.status,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Buyurtma muvaffaqiyatli yuborildi',
      data: this.serializeOrder(order),
    };
  }

  async findMine(userId: number) {
    const orders = await this.prismaService.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: orders.map((order) => this.serializeOrder(order)),
    };
  }

  async findAll() {
    const orders = await this.prismaService.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: orders.map((order) => ({
        ...this.serializeOrder(order),
        user: order.user,
      })),
    };
  }

  async updateStatus(orderId: string, status: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    const updatedOrder = await this.prismaService.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });
    this.ordersEventsService.emitOrderChange({
      event: 'updated',
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      status: updatedOrder.status,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Buyurtma holati muvaffaqiyatli yangilandi',
      data: this.serializeOrder(updatedOrder),
    };
  }

  private async resolveCustomer(
    userId: number | undefined,
    createOrderDto: CreateOrderDto,
  ) {
    if (userId) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new UnauthorizedException("Foydalanuvchi topilmadi");
      }

      if (!user.isActive) {
        throw new ForbiddenException("Hisobingiz vaqtincha faol emas");
      }

      return user;
    }

    const email = createOrderDto.address.email?.trim().toLowerCase();
    const phone = createOrderDto.address.phone;
    const customerName =
      `${createOrderDto.address.firstName} ${createOrderDto.address.lastName}`.trim();

    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new ForbiddenException("Bu mijoz hisobi vaqtincha faol emas");
      }

      if (!existingUser.name || existingUser.name === 'Guest Customer') {
        return await this.prismaService.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            name: customerName,
          },
        });
      }

      return existingUser;
    }

    return await this.prismaService.user.create({
      data: {
        name: customerName || "Mehmon foydalanuvchi",
        email: email || null,
        phone,
        role: 'customer',
      },
    });
  }

  private serializeOrder(order: {
    id: string;
    items: Prisma.JsonValue;
    address: Prisma.JsonValue;
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    totalItems: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: order.id,
      items: order.items,
      address: order.address,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      totalItems: order.totalItems,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
