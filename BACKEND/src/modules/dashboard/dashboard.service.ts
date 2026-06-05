import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);

    const [
      totalFoods,
      totalUsers,
      totalCategories,
      foodAggregates,
      orderAggregates,
      totalOrders,
      monthlyRevenueAggregate,
      yearlyRevenueAggregate,
      yearlyOrders,
      foodsByCategory,
      usersByRole,
      recentFoods,
    ] = await Promise.all([
      this.prismaService.food.count(),
      this.prismaService.user.count(),
      this.prismaService.category.count(),
      this.prismaService.food.aggregate({
        _avg: {
          price: true,
        },
      }),
      this.prismaService.order.aggregate({
        where: {
          status: 'Delivered',
        },
        _sum: {
          totalAmount: true,
          totalItems: true,
        },
      }),
      this.prismaService.order.count(),
      this.prismaService.order.aggregate({
        where: {
          status: 'Delivered',
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prismaService.order.aggregate({
        where: {
          status: 'Delivered',
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prismaService.order.findMany({
        where: {
          status: 'Delivered',
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
      this.prismaService.food.groupBy({
        by: ['category'],
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
      }),
      this.prismaService.user.groupBy({
        by: ['role'],
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            role: 'desc',
          },
        },
      }),
      this.prismaService.food.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          createdAt: true,
        },
      }),
    ]);

    const monthlyRevenueTrend = Array.from({ length: 12 }, (_, index) => {
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
      }).format(new Date(now.getFullYear(), index, 1));

      const value = yearlyOrders
        .filter((order) => order.createdAt.getMonth() === index)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        label,
        value: Number(value.toFixed(2)),
      };
    });

    return {
      success: true,
      data: {
        summary: {
          totalFoods,
          totalUsers,
          totalOrders,
          totalSoldItems: orderAggregates._sum.totalItems ?? 0,
          totalRevenue: Number(orderAggregates._sum.totalAmount ?? 0),
          monthlyRevenue: Number(monthlyRevenueAggregate._sum.totalAmount ?? 0),
          yearlyRevenue: Number(yearlyRevenueAggregate._sum.totalAmount ?? 0),
          averageFoodPrice: Number(foodAggregates._avg.price ?? 0),
          totalCategories,
        },
        charts: {
          foodsByCategory: foodsByCategory.map((item) => ({
            label: item.category,
            value: item._count._all,
          })),
          usersByRole: usersByRole.map((item) => ({
            label: item.role,
            value: item._count._all,
          })),
          monthlyRevenueTrend,
        },
        recentFoods,
      },
    };
  }
}
