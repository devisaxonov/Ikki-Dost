import { mkdirSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { createAuditErrorMiddleware } from './common/middleware/audit-error.middleware';
import { csrfProtectionMiddleware } from './common/middleware/csrf-protection.middleware';
import { AuditService } from './modules/audit/audit.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  const auditService = app.get(AuditService);
  const uploadsPath = join(process.cwd(), 'uploads');
  const corsOrigins = (
    process.env.CORS_ORIGINS ?? ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  mkdirSync(uploadsPath, { recursive: true });
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      strictTransportSecurity:
        process.env.NODE_ENV === 'production'
          ? {
              maxAge: 15_552_000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
    }),
  );
  expressApp.disable('x-powered-by');
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.use(createAuditErrorMiddleware(auditService));
  if (process.env.AUTH_TRANSPORT === 'cookie') {
    app.use(csrfProtectionMiddleware);
  }
  app.use((_req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self)',
    );
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 8080, () => {
    console.log(
      'Server is running on ' + (process.env.API_URL ?? 'http://localhost:' + (process.env.PORT ?? 8080))
    );
  });
}
bootstrap();
