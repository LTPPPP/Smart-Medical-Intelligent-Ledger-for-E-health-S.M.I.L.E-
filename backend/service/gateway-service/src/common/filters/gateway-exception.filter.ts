import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { sanitizeLogPath } from '../sanitize-log-path';

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GatewayException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal gateway error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
        const exceptionResponse = exception.getResponse();
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'Request failed';
      }
    } else if (exception instanceof Error) {
      if (
        (exception as NodeJS.ErrnoException).code === 'ECONNREFUSED' ||
        (exception as NodeJS.ErrnoException).code === 'ETIMEDOUT' ||
        exception.message.includes('ECONNREFUSED') ||
        exception.message.includes('ETIMEDOUT')
      ) {
        status = HttpStatus.BAD_GATEWAY;
        message = 'Downstream service is unavailable';
      }
    }

    const logMessage = `method=${request.method} path=${path} status=${status} correlationId=${correlationId}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
