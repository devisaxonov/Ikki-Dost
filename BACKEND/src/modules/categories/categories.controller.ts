import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/authenticated-user.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  assertSafeUploadedFile,
  buildSecureMulterOptions,
  IMAGE_UPLOAD_MIME_TYPES,
} from '../../common/utils/secure-upload.util';
import { buildAuditRequestContext } from '../audit/audit.types';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    return await this.categoriesService.findAll();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', buildSecureMulterOptions(IMAGE_UPLOAD_MIME_TYPES)),
  )
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
  ) {
    if (file) {
      assertSafeUploadedFile(file, IMAGE_UPLOAD_MIME_TYPES, 5 * 1024 * 1024);
    }

    return await this.categoriesService.create(
      createCategoryDto,
      currentUser.sub,
      buildAuditRequestContext(request, {
        userId: currentUser.sub,
      }),
      file,
    );
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', buildSecureMulterOptions(IMAGE_UPLOAD_MIME_TYPES)),
  )
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
  ) {
    if (file) {
      assertSafeUploadedFile(file, IMAGE_UPLOAD_MIME_TYPES, 5 * 1024 * 1024);
    }

    return await this.categoriesService.update(
      Number(id),
      updateCategoryDto,
      currentUser.sub,
      buildAuditRequestContext(request, {
        userId: currentUser.sub,
      }),
      file,
    );
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return await this.categoriesService.remove(
      Number(id),
      currentUser.sub,
      buildAuditRequestContext(request, {
        userId: currentUser.sub,
      }),
    );
  }
}
