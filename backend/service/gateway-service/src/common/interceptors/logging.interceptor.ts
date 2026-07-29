import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { sanitizeLogPath } from '../sanitize-log-path';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Gateway');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method } = request;
    const path = sanitizeLogPath(request.originalUrl || request.url);
    const headerValue = request.headers['x-correlation-id'];
    const rawCorrelationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    const correlationId =
      typeof rawCorrelationId === 'string' &&
      /^[A-Za-z0-9._:-]{1,128}$/.test(rawCorrelationId)
        ? rawCorrelationId
        : 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        const duration = Date.now() - startTime;
        this.logger.log(
          `method=${method} path=${path} status=${response.statusCode} durationMs=${duration} correlationId=${correlationId}`,
        );
      }),
    );
  }
}
