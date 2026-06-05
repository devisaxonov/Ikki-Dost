import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../../core/database/database.module';
import {
  buildSecureMulterOptions,
  IMAGE_UPLOAD_MIME_TYPES,
} from '../../common/utils/secure-upload.util';

@Module({
  imports: [DatabaseModule,
    MulterModule.register(
      buildSecureMulterOptions(IMAGE_UPLOAD_MIME_TYPES, 5 * 1024 * 1024),
    ),
  ],
  controllers: [FoodsController],
  providers: [FoodsService],
})
export class FoodsModule {}
