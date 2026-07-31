import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Actor } from './actor.util';
import { RequestWithActor } from './jwt-auth.guard';

/**
 * Resolves the actor that JwtAuthGuard verified from the bearer token.
 *
 * This is the only supported source of caller identity/role. Never read
 * `x-auth-user-id` / `x-auth-role` from the request — those are set by the
 * gateway but a client can send them directly to this service's port.
 */
export function resolveCurrentActor(context: ExecutionContext): Actor {
  const request = context.switchToHttp().getRequest<RequestWithActor>();
  if (!request.actor?.accountId) {
    throw new UnauthorizedException('Valid authentication is required');
  }
  return request.actor;
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    resolveCurrentActor(context),
);
