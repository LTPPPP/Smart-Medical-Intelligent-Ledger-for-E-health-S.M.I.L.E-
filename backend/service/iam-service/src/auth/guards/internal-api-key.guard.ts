import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Allows service-to-service calls that carry the shared internal API key in the
 * `x-internal-api-key` header. Used for endpoints that other backend services
 * invoke directly (bypassing the gateway) and therefore cannot present a user
 * JWT — e.g. clinical-emr publishing appointment/schedule notifications.
 *
 * Mirrors the key check already used by kyc-verifications
 * (`IAM_INTERNAL_API_KEY`, default `smile-internal-dev-key`).
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const provided = request.headers['x-internal-api-key'];
    const expected =
      process.env.IAM_INTERNAL_API_KEY || 'smile-internal-dev-key';
    if (!provided || provided !== expected) {
      throw new ForbiddenException('Invalid internal API key');
    }
    return true;
  }
}
