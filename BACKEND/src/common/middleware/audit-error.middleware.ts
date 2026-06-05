import { NextFunction, Request, Response } from 'express';
import { AuditService } from '../../modules/audit/audit.service';
import { buildAuditRequestContext } from '../../modules/audit/audit.types';

export const createAuditErrorMiddleware =
  (auditService: AuditService) =>
  (request: Request, response: Response, next: NextFunction) => {
    response.on('finish', () => {
      if (response.statusCode < 500) {
        return;
      }

      void auditService.logEvent({
        action: 'request.error',
        level: 'error',
        context: buildAuditRequestContext(request, {
          statusCode: response.statusCode,
          metadata: {
            statusMessage: response.statusMessage || 'Internal Server Error',
          },
        }),
      });
    });

    next();
  };
