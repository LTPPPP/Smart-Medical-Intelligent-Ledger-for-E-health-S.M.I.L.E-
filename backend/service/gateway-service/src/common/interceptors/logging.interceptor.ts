import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Request, Response } from "express";
import { sanitizeLogPath } from "../sanitize-log-path";
import { ensureCorrelationId, setCorrelationId } from "../correlation-id";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("Gateway");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method } = request;
    const path = sanitizeLogPath(request.originalUrl || request.url);
    const correlationId = ensureCorrelationId(request);
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        setCorrelationId(response, correlationId);
        const duration = Date.now() - startTime;
        this.logger.log(
          `method=${method} path=${path} status=${response.statusCode} durationMs=${duration} correlationId=${correlationId}`,
        );
      }),
    );
  }
}
