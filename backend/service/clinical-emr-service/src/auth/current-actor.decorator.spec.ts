import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { resolveCurrentActor } from './current-actor.decorator';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('resolveCurrentActor', () => {
  it('should return the actor JwtAuthGuard attached to the request', () => {
    const actor = { accountId: 'account-1', role: 'DOCTOR' };

    expect(resolveCurrentActor(contextFor({ actor, headers: {} }))).toBe(actor);
  });

  it('should reject when no verified actor is attached', () => {
    expect(() => resolveCurrentActor(contextFor({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it('should ignore client-supplied identity headers', () => {
    const request = {
      headers: {
        'x-auth-user-id': 'attacker-controlled',
        'x-auth-role': 'ADMIN',
      },
    };

    expect(() => resolveCurrentActor(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('should not let identity headers override the verified actor', () => {
    const request = {
      actor: { accountId: 'account-1', role: 'PATIENT' },
      headers: {
        'x-auth-user-id': 'attacker-controlled',
        'x-auth-role': 'ADMIN',
      },
    };

    expect(resolveCurrentActor(contextFor(request))).toEqual({
      accountId: 'account-1',
      role: 'PATIENT',
    });
  });
});
