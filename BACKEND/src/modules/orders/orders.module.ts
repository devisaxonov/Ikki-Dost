import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { OrdersController } from './orders.controller';
import { OrdersEventsService } from './orders-events.service';
import { OrdersService } from './orders.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersEventsService],
  exports: [OrdersService, OrdersEventsService],
})
export class OrdersModule {}
