import type { Request } from 'express';
import { AuthenticatedUser } from '../../common/authenticated-user.type';

export type AuditLogLevel = 'info' | 'warn' | 'error';

export type AuditRequestContext = {
  userId?: number | null;
  ipAddress?: string | null;
  endpoint?: string | null;
  method?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, unknown>;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() ?? null;
  }

  return request.ip ?? request.socket?.remoteAddress ?? null;
};

export const buildAuditRequestContext = (
  request: Request,
  options?: {
    userId?: number | null;
    statusCode?: number | null;
    metadata?: Record<string, unknown>;
  },
): AuditRequestContext => {
  const authenticatedRequest = request as AuthenticatedRequest;

  return {
    userId: options?.userId ?? authenticatedRequest.user?.sub ?? null,
    ipAddress: getClientIp(request),
    endpoint: request.originalUrl ?? request.url ?? null,
    method: request.method ?? null,
    statusCode: options?.statusCode ?? null,
    metadata: options?.metadata,
  };
};
