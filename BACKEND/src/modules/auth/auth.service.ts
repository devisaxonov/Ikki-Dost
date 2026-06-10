import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditRequestContext } from '../audit/audit.types';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import * as crypto from 'crypto';

type AppUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  password: string | null;
  role: string;
  isActive: boolean;
  refreshTokenHash: string | null;
  createdAt: Date;
};

type RefreshTokenPayload = {
  sub: number;
  role: string;
  type: 'refresh';
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminUser();
  }

  async register(registerDto: RegisterDto, auditContext?: AuditRequestContext) {
    await this.ensureUniqueCredentials(registerDto.email, registerDto.phone);

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prismaService.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
        role: 'customer',
      },
    });

    const tokens = await this.issueTokensForUser(user);
    await this.auditService.logEvent({
      action: 'auth.register.success',
      level: 'info',
      context: {
        ...auditContext,
        userId: user.id,
        statusCode: 201,
        metadata: {
          ...(auditContext?.metadata ?? {}),
          role: user.role,
        },
      },
    });

    return {
      success: true,
      message: "Hisob muvaffaqiyatli yaratildi",
      data: this.buildAuthPayload(user, tokens),
    };
  }

  async login(loginDto: LoginDto, auditContext?: AuditRequestContext) {
    return await this.loginByRole(loginDto, auditContext);
  }

  async loginAdmin(loginDto: LoginDto, auditContext?: AuditRequestContext) {
    return await this.loginByRole(loginDto, auditContext, ['admin', 'superadmin']);
  }

  async refresh(
    refreshTokenDto: RefreshTokenDto,
    auditContext?: AuditRequestContext,
  ) {
    const payload = this.verifyRefreshToken(refreshTokenDto.refreshToken);
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.isActive || !user.password) {
      await this.auditService.logEvent({
        action: 'auth.refresh.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: payload.sub,
          statusCode: 401,
          metadata: {
            reason: 'user_not_found_or_inactive',
          },
        },
      });
      throw new UnauthorizedException(
        "Refresh token noto'g'ri yoki foydalanuvchi faol emas",
      );
    }

    if (!user.refreshTokenHash) {
      await this.auditService.logEvent({
        action: 'auth.refresh.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: user.id,
          statusCode: 401,
          metadata: {
            reason: 'refresh_token_missing',
          },
        },
      });
      throw new UnauthorizedException("Refresh token topilmadi yoki bekor qilingan");
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      await this.revokeRefreshToken(user.id);
      await this.auditService.logEvent({
        action: 'auth.refresh.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: user.id,
          statusCode: 401,
          metadata: {
            reason: 'refresh_token_mismatch',
          },
        },
      });
      throw new UnauthorizedException(
        "Refresh token noto'g'ri, eskirgan yoki qayta ishlatilgan",
      );
    }

    const tokens = await this.issueTokensForUser(user);
    await this.auditService.logEvent({
      action: 'auth.refresh.success',
      level: 'info',
      context: {
        ...auditContext,
        userId: user.id,
        statusCode: 200,
      },
    });

    return {
      success: true,
      message: 'Sessiya muvaffaqiyatli yangilandi',
      data: this.buildAuthPayload(user, tokens),
    };
  }

  async logout(userId: number, auditContext?: AuditRequestContext) {
    await this.revokeRefreshToken(userId);
    await this.auditService.logEvent({
      action: 'auth.logout.success',
      level: 'info',
      context: {
        ...auditContext,
        userId,
        statusCode: 200,
      },
    });

    return {
      success: true,
      message: 'Tizimdan chiqildi',
    };
  }

  async me(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Foydalanuvchi topilmadi yoki faol emas");
    }

    return {
      success: true,
      data: this.serializeUser(user),
    };
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    auditContext?: AuditRequestContext,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Foydalanuvchi topilmadi yoki faol emas");
    }

    const nextName = updateProfileDto.name?.trim();
    const nextEmail = updateProfileDto.email?.trim().toLowerCase();
    const nextPhone = updateProfileDto.phone?.trim();
    const wantsPasswordChange = Boolean(updateProfileDto.newPassword);

    if (
      !nextName &&
      !nextEmail &&
      !nextPhone &&
      !updateProfileDto.currentPassword &&
      !updateProfileDto.newPassword
    ) {
      throw new BadRequestException(
        "Yangilash uchun kamida bitta maydonni to'ldiring",
      );
    }

    if (wantsPasswordChange && !updateProfileDto.currentPassword) {
      throw new BadRequestException(
        "Yangi parolni saqlash uchun joriy parolni kiriting",
      );
    }

    const updateData: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    } = {};

    if (nextName && nextName !== user.name) {
      updateData.name = nextName;
    }

    if (nextEmail && nextEmail !== user.email) {
      await this.ensureUniqueCredentials(nextEmail, undefined, user.id);
      updateData.email = nextEmail;
    }

    if (nextPhone && nextPhone !== user.phone) {
      await this.ensureUniqueCredentials(undefined, nextPhone, user.id);
      updateData.phone = nextPhone;
    }

    if (wantsPasswordChange) {
      if (!user.password) {
        throw new BadRequestException(
          "Ushbu hisob uchun parolni o'zgartirib bo'lmaydi",
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        await this.auditService.logEvent({
          action: 'auth.password_change.failed',
          level: 'warn',
          context: {
            ...auditContext,
            userId: user.id,
            statusCode: 401,
            metadata: {
              reason: 'invalid_current_password',
            },
          },
        });
        throw new UnauthorizedException("Joriy parol noto'g'ri");
      }

      updateData.password = await bcrypt.hash(updateProfileDto.newPassword, 12);
    }

    const updatedUser =
      Object.keys(updateData).length > 0
        ? await this.prismaService.user.update({
            where: {
              id: user.id,
            },
            data: updateData,
          })
        : user;

    const tokens = await this.issueTokensForUser(updatedUser);

    if (wantsPasswordChange) {
      await this.auditService.logEvent({
        action: 'auth.password_change.success',
        level: 'info',
        context: {
          ...auditContext,
          userId: updatedUser.id,
          statusCode: 200,
        },
      });
    }

    return {
      success: true,
      message: "Profil ma'lumotlari yangilandi",
      data: this.buildAuthPayload(updatedUser, tokens),
    };
  }

  async forgotPassword(email: string, auditContext?: AuditRequestContext) {
    const user = await this.prismaService.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive || !user.email) {
      return { success: true, message: "Agar bu email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Ikki Dost <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Parolni qayta tiklash - Ikki Dost',
          html: `
            <h2>Parolni qayta tiklash</h2>
            <p>Siz (yoki kimdir) Ikki Dost tizimida parolingizni tiklashni so'radi.</p>
            <p>Iltimos, parolni tiklash uchun quyidagi havolaga o'ting:</p>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
            <p>Agar siz buni so'ramagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring va parolingiz o'zgarishsiz qoladi.</p>
            <p>Havola 1 soatdan so'ng o'z kuchini yo'qotadi.</p>
          `,
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Resend xatosi:', result);
        throw new Error(result.message || 'Resend API error');
      }
    } catch (error) {
      console.error('Email yuborishda xatolik:', error);
      throw new InternalServerErrorException("Email yuborishda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
    }

    await this.auditService.logEvent({
      action: 'auth.forgot_password.success',
      level: 'info',
      context: {
        ...auditContext,
        userId: user.id,
      },
    });

    return { success: true, message: "Parolni tiklash havolasi emailingizga yuborildi." };
  }

  async resetPassword(token: string, newPassword: string, auditContext?: AuditRequestContext) {
    const user = await this.prismaService.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException("Parolni tiklash havolasi yaroqsiz yoki muddati o'tgan.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await this.auditService.logEvent({
      action: 'auth.reset_password.success',
      level: 'info',
      context: {
        ...auditContext,
        userId: user.id,
      },
    });

    return { success: true, message: "Parolingiz muvaffaqiyatli yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin." };
  }

  private async loginByRole(
    loginDto: LoginDto,
    auditContext?: AuditRequestContext,
    allowedRoles?: string[],
  ) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: loginDto.email,
      },
    });

    if (!user || !user.password) {
      await this.auditService.logEvent({
        action: 'auth.login.failed',
        level: 'warn',
        context: {
          ...auditContext,
          statusCode: 401,
          metadata: {
            ...(auditContext?.metadata ?? {}),
            reason: 'invalid_credentials',
          },
        },
      });
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (!user.isActive) {
      await this.auditService.logEvent({
        action: 'auth.login.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: user.id,
          statusCode: 403,
          metadata: {
            ...(auditContext?.metadata ?? {}),
            reason: 'inactive_account',
          },
        },
      });
      throw new ForbiddenException("Hisobingiz vaqtincha faol emas");
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatches) {
      await this.auditService.logEvent({
        action: 'auth.login.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: user.id,
          statusCode: 401,
          metadata: {
            ...(auditContext?.metadata ?? {}),
            reason: 'invalid_credentials',
          },
        },
      });
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      await this.auditService.logEvent({
        action: 'auth.login.failed',
        level: 'warn',
        context: {
          ...auditContext,
          userId: user.id,
          statusCode: 403,
          metadata: {
            ...(auditContext?.metadata ?? {}),
            reason: 'role_not_allowed',
            requiredRoles: allowedRoles,
          },
        },
      });
      throw new ForbiddenException("Bu bo'limga kirish uchun sizda ruxsat yo'q");
    }

    const tokens = await this.issueTokensForUser(user);
    await this.auditService.logEvent({
      action: 'auth.login.success',
      level: 'info',
      context: {
        ...auditContext,
        userId: user.id,
        statusCode: 200,
        metadata: {
          ...(auditContext?.metadata ?? {}),
          role: user.role,
        },
      },
    });

    return {
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: this.buildAuthPayload(user, tokens),
    };
  }

  private buildAuthPayload(
    user: {
      id: number;
      name: string;
      email: string | null;
      phone: string | null;
      role: string;
      isActive: boolean;
      createdAt: Date;
    },
    tokens: {
      accessToken: string;
      refreshToken: string;
    },
  ) {
    return {
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.serializeUser(user),
    };
  }

  private async issueTokensForUser(user: AppUser | Omit<AppUser, 'password'>) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async revokeRefreshToken(userId: number) {
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });
  }

  private signAccessToken(user: {
    id: number;
    name: string;
    email: string | null;
    role: string;
  }) {
    const secret = this.getRequiredConfig('JWT_SECRET');

    return jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.role,
        type: 'access',
      },
      secret,
      {
        expiresIn:
          this.configService.get<string>('JWT_EXPIRES_IN') ??
          process.env.JWT_EXPIRES_IN ??
          '15m',
      },
    );
  }

  private signRefreshToken(user: {
    id: number;
    role: string;
  }) {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      process.env.JWT_REFRESH_SECRET ??
      this.getRequiredConfig('JWT_SECRET');

    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        type: 'refresh',
      },
      secret,
      {
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          process.env.JWT_REFRESH_EXPIRES_IN ??
          '30d',
      },
    );
  }

  private verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      process.env.JWT_REFRESH_SECRET ??
      this.getRequiredConfig('JWT_SECRET');

    try {
      const payload = jwt.verify(refreshToken, secret) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException("Refresh token noto'g'ri formatda");
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        "Refresh token noto'g'ri yoki muddati tugagan",
      );
    }
  }

  private getRequiredConfig(key: 'JWT_SECRET') {
    const value = this.configService.get<string>(key) ?? process.env[key];

    if (!value) {
      throw new InternalServerErrorException(`${key} sozlanmagan`);
    }

    return value;
  }

  private serializeUser(user: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  private async ensureUniqueCredentials(
    email?: string,
    phone?: string,
    excludedUserId?: number,
  ) {
    if (!email && !phone) {
      return;
    }

    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
        ...(excludedUserId
          ? {
              NOT: {
                id: excludedUserId,
              },
            }
          : {}),
      },
    });

    if (!existingUser) {
      return;
    }

    if (email && existingUser.email === email) {
      throw new ConflictException(
        "Bu email bilan foydalanuvchi allaqachon mavjud",
      );
    }

    if (phone && existingUser.phone === phone) {
      throw new ConflictException(
        "Bu telefon raqam bilan foydalanuvchi allaqachon mavjud",
      );
    }
  }

  private async ensureAdminUser() {
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') ?? process.env.ADMIN_EMAIL;
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') ??
      process.env.ADMIN_PASSWORD;
    const adminName =
      this.configService.get<string>('ADMIN_NAME') ??
      process.env.ADMIN_NAME ??
      'Super Admin';

    if (!adminEmail || !adminPassword) {
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const existingAdmin = await this.prismaService.user.findFirst({
      where: {
        email: adminEmail.toLowerCase(),
      },
    });

    if (!existingAdmin) {
      await this.prismaService.user.create({
        data: {
          name: adminName,
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          role: 'superadmin',
          isActive: true,
        },
      });

      return;
    }

    await this.prismaService.user.update({
      where: {
        id: existingAdmin.id,
      },
      data: {
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
      },
    });
  }
}
