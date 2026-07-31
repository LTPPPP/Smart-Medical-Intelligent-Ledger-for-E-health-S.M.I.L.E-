import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guards server-to-server endpoints (e.g. clinical-emr posting notifications).
 * Callers must send an `x-internal-token` header matching
 * INTERNAL_SERVICE_TOKEN.
 *
 * A missing INTERNAL_SERVICE_TOKEN denies every request — these endpoints
 * create user-visible notifications and manage templates, so an unconfigured
 * deployment must not leave them open.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      throw new UnauthorizedException(
        'Internal service authentication is not configured',
      );
    }

    const request = context.switchToHttp().getRequest();
    const provided = request.headers?.['x-internal-token'];
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('Missing internal service token');
    }

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    return true;
  }
}
