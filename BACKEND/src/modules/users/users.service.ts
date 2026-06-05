import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditRequestContext } from '../audit/audit.types';
import { CreateAdminDto } from './dto/create-admin.dto';

const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const users = await this.prismaService.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return {
      success: true,
      data: users,
    };
  }

  async createAdmin(
    createAdminDto: CreateAdminDto,
    actorUserId: number,
    auditContext?: AuditRequestContext,
  ) {
    const email = createAdminDto.email.toLowerCase();
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        "Bu email bilan foydalanuvchi allaqachon mavjud",
      );
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 12);
    const admin = await this.prismaService.user.create({
      data: {
        name: createAdminDto.name,
        email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.logEvent({
      action: 'user.admin_create',
      level: 'info',
      context: {
        ...auditContext,
        userId: actorUserId,
        statusCode: 201,
        metadata: {
          targetUserId: admin.id,
          targetEmail: admin.email,
          targetRole: admin.role,
        },
      },
    });

    return {
      success: true,
      message: "Admin muvaffaqiyatli qo'shildi",
      data: admin,
    };
  }

  async updateRole(
    userId: number,
    role: string,
    actorUserId: number,
    auditContext?: AuditRequestContext,
  ) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException("Foydalanuvchi ID noto'g'ri");
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (user.id === actorUserId) {
      throw new BadRequestException(
        "O'zingizning rolingizni bu yerdan o'zgartirib bo'lmaydi",
      );
    }

    if (user.role === 'superadmin') {
      throw new BadRequestException("Superadmin rolini o'zgartirib bo'lmaydi");
    }

    const previousRole = user.role;

    if (previousRole === role) {
      return {
        success: true,
        message: 'Foydalanuvchi roli o‘zgarmadi',
        data: {
          id: user.id,
          role: user.role,
        },
      };
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });

    await this.auditService.logEvent({
      action: 'user.role_update',
      level: 'info',
      context: {
        ...auditContext,
        userId: actorUserId,
        statusCode: 200,
        metadata: {
          targetUserId: updatedUser.id,
          previousRole,
          nextRole: updatedUser.role,
        },
      },
    });

    return {
      success: true,
      message: 'Foydalanuvchi roli yangilandi',
      data: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    };
  }
}
