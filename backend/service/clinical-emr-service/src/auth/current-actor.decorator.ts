import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Actor } from './actor.util';

/**
 * Injects the trusted actor that JwtAuthGuard attached to the request (from the
 * verified bearer token). Undefined only on routes without JwtAuthGuard.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor | undefined => {
    const request = ctx.switchToHttp().getRequest<{ actor?: Actor }>();
    return request.actor;
  },
);
