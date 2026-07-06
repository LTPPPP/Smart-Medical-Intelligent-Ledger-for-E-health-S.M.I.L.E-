import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';
import { RequestWithActor } from '../jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const role = request.actor?.role as RoleEnum | undefined;
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
