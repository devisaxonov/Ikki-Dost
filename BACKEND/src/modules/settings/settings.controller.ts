import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('delivery-fee')
  async getDeliveryFee() {
    const fee = await this.settingsService.getDeliveryFee();
    return { success: true, data: { deliveryFee: fee } };
  }

  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('delivery-fee')
  async updateDeliveryFee(@Body('deliveryFee') fee: number) {
    const settings = await this.settingsService.updateDeliveryFee(fee);
    return { success: true, message: 'Dastavka narxi yangilandi', data: settings };
  }
}
