import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guards server-to-server endpoints (e.g. clinical-emr posting notifications).
 * When INTERNAL_SERVICE_TOKEN is unset the guard allows all traffic so local
 * dev keeps working without extra configuration; once set, callers must send
 * a matching `x-internal-token` header.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      return true;
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
