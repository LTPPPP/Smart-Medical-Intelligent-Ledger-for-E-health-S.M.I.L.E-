import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Actor, extractActorFromAuthorization } from './actor.util';

export interface RequestWithActor extends Request {
  actor?: Actor;
}

/**
 * Requires a valid HS256 bearer token and attaches the trusted actor to the
 * request. Combine with RolesGuard (declared after this guard) to also enforce
 * a role.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = extractActorFromAuthorization(
      request.headers.authorization,
      process.env.AUTH_JWT_SECRET,
    );
    if (!actor) {
      throw new UnauthorizedException('Valid authentication is required');
    }
    request.actor = actor;
    return true;
  }
}
