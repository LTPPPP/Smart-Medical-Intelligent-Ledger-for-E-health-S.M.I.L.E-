import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy logging privacy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not log Redis error text or token identifiers', async () => {
    process.env.AUTH_JWT_SECRET = 'test-secret';
    const rawError = 'sentinel-patient@example.test redis://private-user:private-password';
    const redisError = Object.assign(new Error(rawError), {
      name: 'ReplyError',
      code: 'ECONNREFUSED',
    });
    const strategy = new JwtStrategy(
      {} as any,
      {
        findById: jest.fn().mockResolvedValue({
          accountId: 'sentinel-account-id',
          email: 'patient@example.test',
          role: 'PATIENT',
          status: 'ACTIVE',
        }),
      } as any,
      {
        exists: jest.fn().mockRejectedValue(redisError),
      } as any,
    );
    const warn = jest.spyOn((strategy as any).logger, 'warn').mockImplementation();

    await strategy.validate({
      accountId: 'sentinel-account-id',
      jti: 'sentinel-live-jti',
      exp: Math.floor(Date.now() / 1000) + 60,
    } as any);

    expect(warn).toHaveBeenCalledWith(
      'operation=redis_token_blacklist_check outcome=failed error_class=ReplyError error_code=ECONNREFUSED',
    );
    const output = JSON.stringify(warn.mock.calls);
    expect(output).not.toContain(rawError);
    expect(output).not.toContain('sentinel-live-jti');
    expect(output).not.toContain('sentinel-account-id');
  });
});
