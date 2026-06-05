import { NextFunction, Request, Response } from 'express';
import { parseCookies } from '../utils/cookie.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const cookies = parseCookies(req.headers.cookie);
  const authCookieName = process.env.AUTH_COOKIE_NAME ?? 'access_token';
  const csrfCookieName = process.env.CSRF_COOKIE_NAME ?? 'csrf_token';
  const authCookie = cookies[authCookieName];

  if (!authCookie) {
    return next();
  }

  const csrfCookie = cookies[csrfCookieName];
  const csrfHeader = req.headers['x-csrf-token'];

  if (
    !csrfCookie ||
    typeof csrfHeader !== 'string' ||
    csrfCookie !== csrfHeader
  ) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token noto‘g‘ri yoki topilmadi',
    });
  }

  return next();
};
