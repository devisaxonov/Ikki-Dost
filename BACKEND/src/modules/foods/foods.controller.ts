import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  assertSafeUploadedFile,
  IMAGE_UPLOAD_MIME_TYPES,
} from '../../common/utils/secure-upload.util';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createFoodDto: CreateFoodDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    assertSafeUploadedFile(file, IMAGE_UPLOAD_MIME_TYPES, 5 * 1024 * 1024);

    return await this.foodsService.create(createFoodDto, file);
  }

  @Get()
  async findAll() {
    const data = await this.foodsService.findAll();    
    return data
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      assertSafeUploadedFile(file, IMAGE_UPLOAD_MIME_TYPES, 5 * 1024 * 1024);
    }

    return this.foodsService.update(id, updateFoodDto, file);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.foodsService.remove(id);
  }
}
