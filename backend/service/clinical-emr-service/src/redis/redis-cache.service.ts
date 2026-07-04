import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AllConfigType } from '../config/config.type';
import { REDIS_CLIENT } from './redis.constants';

// Cache-aside helper over the shared Redis client. Every operation fails
// open (logs and falls back to the loader / no-op) so an unavailable Redis
// never breaks a request.
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTtlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    configService: ConfigService<AllConfigType>,
  ) {
    this.defaultTtlSeconds = configService.getOrThrow(
      'redis.cacheTtlSeconds',
      { infer: true },
    );
  }

  async wrap<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      this.logger.warn(
        `Redis GET failed for "${key}", falling back to loader: ${(err as Error).message}`,
      );
      return loader();
    }

    const value = await loader();
    if (value !== null && value !== undefined) {
      await this.redis
        .set(key, JSON.stringify(value), 'EX', ttlSeconds)
        .catch((err: Error) =>
          this.logger.warn(`Redis SET failed for "${key}": ${err.message}`),
        );
    }
    return value;
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    await this.redis
      .del(...keys)
      .catch((err: Error) =>
        this.logger.warn(
          `Redis DEL failed for "${keys.join('", "')}": ${err.message}`,
        ),
      );
  }
}
