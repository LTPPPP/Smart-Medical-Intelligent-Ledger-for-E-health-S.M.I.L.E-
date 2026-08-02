import {
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

// Fixed Window Rate Limiter
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly enabled: boolean;
  private readonly windowSeconds: number;
  private readonly maxRequests: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    configService: ConfigService,
  ) {
    this.enabled =
      configService.get<boolean>('services.rateLimit.enabled') ?? true;
    this.windowSeconds =
      configService.get<number>('services.rateLimit.windowSeconds') || 60;
    this.maxRequests =
      configService.get<number>('services.rateLimit.maxRequests') || 300;
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.enabled) {
      return next();
    }

    const identity = this.identityFor(req);
    const windowIndex = Math.floor(Date.now() / 1000 / this.windowSeconds);
    const key = `gateway:ratelimit:${identity}:${windowIndex}`;

    let count: number;
    try {
      count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, this.windowSeconds);
      }
    } catch {
      this.logger.warn(
        'operation=rate_limit outcome=disabled reason=redis_unavailable',
      );
      return next();
    }

    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, this.maxRequests - count),
    );

    if (count > this.maxRequests) {
      const retryAfter =
        (windowIndex + 1) * this.windowSeconds -
        Math.floor(Date.now() / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfter));
      res.status(429).json({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
      });
      return;
    }

    next();
  }

  private identityFor(req: Request): string {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(
          Buffer.from(auth.slice(7).split('.')[1], 'base64url').toString(
            'utf8',
          ),
        ) as { accountId?: string };
        if (payload.accountId) {
          return `account:${payload.accountId}`;
        }
      } catch {
        // Malformed Token
      }
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] ||
      req.ip ||
      'unknown';
    return `ip:${ip.trim()}`;
  }
}
