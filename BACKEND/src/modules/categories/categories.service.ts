import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  deleteStoredFile,
  saveUploadedFile,
} from '../../common/utils/secure-upload.util';
import { AuditService } from '../audit/audit.service';
import { AuditRequestContext } from '../audit/audit.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    actorUserId?: number,
    auditContext?: AuditRequestContext,
    file?: Express.Multer.File,
  ) {
    const existingCategory = await this.prismaService.category.findFirst({
      where: {
        name: {
          equals: createCategoryDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      throw new ConflictException('Bu kategoriya allaqachon mavjud');
    }

    let image: string | null = null;

    try {
      if (file) {
        image = await saveUploadedFile(file, 'categories');
      }

      const category = await this.prismaService.category.create({
        data: {
          name: createCategoryDto.name,
          image,
        },
      });

      if (actorUserId) {
        await this.auditService.logEvent({
          action: 'category.create',
          level: 'info',
          context: {
            ...auditContext,
            userId: actorUserId,
            statusCode: 201,
            metadata: {
              categoryId: category.id,
              categoryName: category.name,
              hasImage: Boolean(category.image),
            },
          },
        });
      }

      return {
        success: true,
        message: "Kategoriya muvaffaqiyatli qo'shildi",
        data: {
          id: category.id,
          name: category.name,
          image: category.image,
          foodsCount: 0,
          createdAt: category.createdAt,
        },
      };
    } catch (error) {
      if (image) {
        await deleteStoredFile(image);
      }

      throw error;
    }
  }

  async findAll() {
    await this.syncExistingFoodCategories();

    const [categories, foodCounts] = await Promise.all([
      this.prismaService.category.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
      this.prismaService.food.groupBy({
        by: ['category'],
        _count: {
          _all: true,
        },
      }),
    ]);

    const foodCountMap = new Map(
      foodCounts.map((item) => [item.category, item._count._all]),
    );

    return {
      success: true,
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        foodsCount: foodCountMap.get(category.name) ?? 0,
        createdAt: category.createdAt,
      })),
    };
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    actorUserId?: number,
    auditContext?: AuditRequestContext,
    file?: Express.Multer.File,
  ) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    const nextName = updateCategoryDto.name.trim();

    if (nextName.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await this.prismaService.category.findFirst({
        where: {
          name: {
            equals: nextName,
            mode: 'insensitive',
          },
          NOT: {
            id,
          },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Bu kategoriya nomi allaqachon mavjud');
      }
    }

    let nextImagePath: string | null = null;

    try {
      if (file) {
        nextImagePath = await saveUploadedFile(file, 'categories');
      }

      const updatedCategory = await this.prismaService.category.update({
        where: {
          id,
        },
        data: {
          name: nextName,
          ...(nextImagePath ? { image: nextImagePath } : {}),
        },
      });

      if (category.name !== updatedCategory.name) {
        await this.prismaService.food.updateMany({
          where: {
            category: category.name,
          },
          data: {
            category: updatedCategory.name,
          },
        });
      }

      if (category.image && category.image !== updatedCategory.image && file) {
        await deleteStoredFile(category.image);
      }

      if (actorUserId) {
        await this.auditService.logEvent({
          action: 'category.update',
          level: 'info',
          context: {
            ...auditContext,
            userId: actorUserId,
            statusCode: 200,
            metadata: {
              categoryId: updatedCategory.id,
              previousName: category.name,
              nextName: updatedCategory.name,
              imageUpdated: Boolean(file),
            },
          },
        });
      }

      const foodsCount = await this.prismaService.food.count({
        where: {
          category: updatedCategory.name,
        },
      });

      return {
        success: true,
        message: 'Kategoriya muvaffaqiyatli yangilandi',
        data: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          image: updatedCategory.image,
          foodsCount,
          createdAt: updatedCategory.createdAt,
        },
      };
    } catch (error) {
      if (nextImagePath) {
        await deleteStoredFile(nextImagePath);
      }

      throw error;
    }
  }

  async remove(
    id: number,
    actorUserId?: number,
    auditContext?: AuditRequestContext,
  ) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    const attachedFoodsCount = await this.prismaService.food.count({
      where: {
        category: category.name,
      },
    });

    if (attachedFoodsCount > 0) {
      throw new ConflictException(
        "Bu kategoriya ishlatilmoqda. Avval shu kategoriyadagi taomlarni o'zgartiring yoki o'chiring",
      );
    }

    await this.prismaService.category.delete({
      where: {
        id,
      },
    });

    if (category.image) {
      await deleteStoredFile(category.image);
    }

    if (actorUserId) {
      await this.auditService.logEvent({
        action: 'category.delete',
        level: 'info',
        context: {
          ...auditContext,
          userId: actorUserId,
          statusCode: 200,
          metadata: {
            categoryId: category.id,
            categoryName: category.name,
            hadImage: Boolean(category.image),
          },
        },
      });
    }

    return {
      success: true,
      message: "Kategoriya muvaffaqiyatli o'chirildi",
    };
  }

  private async syncExistingFoodCategories() {
    const foodCategories = await this.prismaService.food.groupBy({
      by: ['category'],
    });

    const names = foodCategories
      .map((item) => item.category?.trim())
      .filter((item): item is string => Boolean(item));

    if (names.length === 0) {
      return;
    }

    await this.prismaService.category.createMany({
      data: names.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }
}
