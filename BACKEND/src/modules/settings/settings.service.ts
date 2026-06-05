import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDeliveryFee(): Promise<number> {
    const settings = await this.prismaService.settings.findUnique({
      where: { id: 1 },
    });
    return settings?.deliveryFee ?? 0;
  }

  async updateDeliveryFee(fee: number) {
    const settings = await this.prismaService.settings.upsert({
      where: { id: 1 },
      update: { deliveryFee: fee },
      create: { id: 1, deliveryFee: fee },
    });
    return settings;
  }
}
