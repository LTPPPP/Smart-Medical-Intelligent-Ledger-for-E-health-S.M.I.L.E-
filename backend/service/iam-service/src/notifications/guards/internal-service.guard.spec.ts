import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InternalServiceGuard } from './internal-service.guard';

function contextWith(token?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token === undefined ? {} : { 'x-internal-token': token },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('InternalServiceGuard', () => {
  const guard = new InternalServiceGuard();
  const original = process.env.INTERNAL_SERVICE_TOKEN;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.INTERNAL_SERVICE_TOKEN;
    } else {
      process.env.INTERNAL_SERVICE_TOKEN = original;
    }
  });

  it('denies every request when no token is configured', () => {
    delete process.env.INTERNAL_SERVICE_TOKEN;

    expect(() => guard.canActivate(contextWith('anything'))).toThrow(
      UnauthorizedException,
    );
  });

  it('denies a request with no token header', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'expected-token';

    expect(() => guard.canActivate(contextWith())).toThrow(
      UnauthorizedException,
    );
  });

  it('denies a mismatched token', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'expected-token';

    expect(() => guard.canActivate(contextWith('wrong-token'))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows a matching token', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'expected-token';

    expect(guard.canActivate(contextWith('expected-token'))).toBe(true);
  });
});
