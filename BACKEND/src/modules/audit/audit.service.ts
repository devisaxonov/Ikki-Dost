import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditLogLevel, AuditRequestContext } from './audit.types';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'set-cookie',
  'csrfToken',
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async logEvent(params: {
    action: string;
    level?: AuditLogLevel;
    context?: AuditRequestContext;
  }) {
    const level = params.level ?? 'info';
    const metadata = this.sanitizeMetadata(params.context?.metadata);
    const entry = {
      action: params.action,
      level,
      userId: params.context?.userId ?? null,
      ipAddress: params.context?.ipAddress ?? null,
      endpoint: params.context?.endpoint ?? null,
      method: params.context?.method ?? null,
      statusCode: params.context?.statusCode ?? null,
      metadata,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.prismaService.auditLog.create({
        data: {
          action: entry.action,
          level: entry.level,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          endpoint: entry.endpoint,
          method: entry.method,
          statusCode: entry.statusCode,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Audit log saqlanmadi: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.writeConsoleEntry(entry, level);
  }

  private writeConsoleEntry(entry: Record<string, unknown>, level: AuditLogLevel) {
    const message = JSON.stringify(entry);

    if (level === 'error') {
      this.logger.error(message);
      return;
    }

    if (level === 'warn') {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private sanitizeMetadata(
    value: unknown,
  ): Record<string, unknown> | undefined {
    const sanitized = this.sanitizeValue(value);

    if (
      sanitized &&
      typeof sanitized === 'object' &&
      !Array.isArray(sanitized)
    ) {
      return sanitized as Record<string, unknown>;
    }

    return sanitized === undefined
      ? undefined
      : { value: sanitized as Prisma.JsonValue };
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.length > 500 ? `${value.slice(0, 497)}...` : value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, 20)
        .map((item) => this.sanitizeValue(item))
        .filter((item) => item !== undefined);
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, nestedValue] of Object.entries(value)) {
        if (SENSITIVE_KEYS.has(key)) {
          result[key] = '[REDACTED]';
          continue;
        }

        const sanitizedValue = this.sanitizeValue(nestedValue);

        if (sanitizedValue !== undefined) {
          result[key] = sanitizedValue;
        }
      }

      return result;
    }

    return String(value);
  }
}
