import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Repository } from 'typeorm';

import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';

const TTL_MS = 24 * 60 * 60 * 1000;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @InjectRepository(IdempotencyKeyEntity, 'clinicConnection')
    private readonly repo: Repository<IdempotencyKeyEntity>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const key = request.headers['idempotency-key'] as string | undefined;

    if (!key || !MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    const now = Date.now();
    const existing = await this.repo.findOne({
      where: { idempotency_key: key },
    });

    if (existing) {
      const expired = existing.expires_at.getTime() < now;
      if (!expired && existing.status === 'completed') {
        if (existing.response_status) {
          response.status(existing.response_status);
        }
        return of(existing.response_body);
      }
      if (!expired && existing.status === 'in_progress') {
        throw new ConflictException(
          'A request with this Idempotency-Key is already being processed.',
        );
      }
      await this.repo.delete({ idempotency_key: key });
    }

    try {
      await this.repo.insert({
        idempotency_key: key,
        method: request.method,
        path: request.originalUrl ?? request.url,
        status: 'in_progress',
        expires_at: new Date(now + TTL_MS),
      });
    } catch {
      throw new ConflictException(
        'A request with this Idempotency-Key is already being processed.',
      );
    }

    return next.handle().pipe(
      tap((body) => {
        const statusCode = response.statusCode ?? 201;
        this.repo
          .update(
            { idempotency_key: key },
            {
              status: 'completed',
              response_status: statusCode,
              response_body: body ?? null,
            },
          )
          .catch((error) =>
            this.logger.warn(
              `Failed to persist idempotent response: ${error}`,
            ),
          );
      }),
      catchError((error) => {
        this.repo.delete({ idempotency_key: key }).catch(() => undefined);
        throw error;
      }),
    );
  }
}
