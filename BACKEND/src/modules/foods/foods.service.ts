import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { PrismaService } from '../../core/database/prisma.service';
import {
  deleteStoredFile,
  saveUploadedFile,
} from '../../common/utils/secure-upload.util';

@Injectable()
export class FoodsService {
  constructor(private prismaService: PrismaService){}

  async create(createFoodDto: CreateFoodDto, file: Express.Multer.File) {
    const category = await this.prismaService.category.findFirst({
      where: {
        name: {
          equals: createFoodDto.category,
          mode: 'insensitive',
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Tanlangan kategoriya topilmadi');
    }

    const image = await saveUploadedFile(file, 'foods');
    const food = await this.prismaService.food.create({
      data: {
        ...createFoodDto,
        category: category.name,
        image,
        price: Number(createFoodDto.price),
      },
    });

    return {
      success: true,
      message: 'Food added successfully',
      data: food,
    };
  }

  async findAll() {
    const foods = await this.prismaService.food.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: foods,
    };
  }

  async findOne(id: string) {
    const food = await this.prismaService.food.findUnique({
      where: { id },
    });

    if (!food) {
      throw new NotFoundException('Food not found');
    }

    return {
      success: true,
      data: food,
    };
  }

  async update(
    id: string,
    updateFoodDto: UpdateFoodDto,
    file?: Express.Multer.File,
  ) {
    const food = await this.prismaService.food.findUnique({
      where: { id },
    });

    if (!food) {
      throw new NotFoundException('Food not found');
    }

    const data: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image?: string;
    } = {};

    if (updateFoodDto.name) {
      data.name = updateFoodDto.name;
    }

    if (updateFoodDto.description) {
      data.description = updateFoodDto.description;
    }

    if (typeof updateFoodDto.price === 'number') {
      data.price = Number(updateFoodDto.price);
    }

    if (updateFoodDto.category) {
      const category = await this.prismaService.category.findFirst({
        where: {
          name: {
            equals: updateFoodDto.category,
            mode: 'insensitive',
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Tanlangan kategoriya topilmadi');
      }

      data.category = category.name;
    }

    if (file) {
      data.image = await saveUploadedFile(file, 'foods');
    }

    const updatedFood = await this.prismaService.food.update({
      where: { id },
      data,
    });

    if (file && food.image !== updatedFood.image) {
      await deleteStoredFile(food.image);
    }

    return {
      success: true,
      message: 'Food updated successfully',
      data: updatedFood,
    };
  }

  async remove(id: string) {
    const food = await this.prismaService.food.findUnique({
      where: { id },
    });

    if (!food) {
      throw new NotFoundException('Food not found');
    }

    await this.prismaService.food.delete({
      where: { id },
    });

    await deleteStoredFile(food.image);

    return {
      success: true,
      message: 'Food removed successfully',
    };
  }
}
