jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import { AuthService } from './auth.service';

describe('AuthService logging privacy', () => {
  const accountId = 'sentinel-account-id';
  const signedToken = 'sentinel-live-jwt';

  function createService(redisOverrides: Record<string, unknown> = {}) {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue(signedToken),
    };
    const accountsService = {
      findByEmail: jest.fn().mockResolvedValue({
        accountId,
        email: 'patient@example.test',
        passwordHash: 'stored-hash',
        role: 'PATIENT',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
      }),
      isAccountLocked: jest.fn().mockResolvedValue(false),
      resetFailedLoginAttempts: jest.fn().mockResolvedValue(undefined),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue({
        accountId,
      }),
    };
    const userProfilesService = {
      create: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'auth.confirmEmailSecret': 'confirm-secret',
          'auth.confirmEmailExpires': '1h',
          'auth.forgotSecret': 'forgot-secret',
          'auth.forgotExpires': '1h',
        };
        return values[key];
      }),
    };
    const otpTokensService = {
      create: jest.fn().mockResolvedValue({
        otpCode: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
      findValidByAccountAndCode: jest.fn().mockResolvedValue(null),
      markAsUsed: jest.fn().mockResolvedValue(undefined),
    };
    const mailService = {
      sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined),
    };
    const redis = {
      exists: jest.fn().mockResolvedValue(0),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      ...redisOverrides,
    };

    const service = new AuthService(
      jwtService as any,
      accountsService as any,
      { revokeByAccountId: jest.fn() } as any,
      {} as any,
      otpTokensService as any,
      userProfilesService as any,
      configService as any,
      mailService as any,
      redis as any,
    );
    (service as any).getTokensData = jest.fn().mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      tokenExpires: 1,
    });

    return { service };
  }

  it('does not log account identifiers while minting login tokens', async () => {
    const { service } = createService();
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();

    await service.validateLogin({
      email: 'patient@example.test',
      password: 'password',
    });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('does not log live email-confirmation or password-reset JWTs', async () => {
    const { service } = createService();
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();

    await service.register({
      email: 'patient@example.test',
      password: 'password',
      username: 'patient',
    });
    await service.forgotPassword('patient@example.test');

    expect(consoleLog).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain(signedToken);
  });

  it('logs bounded Redis failure metadata without the raw transport error', async () => {
    const rawError =
      'SENTINEL_REDIS_ERROR redis://private-user:private-password@internal-host';
    const redisError = Object.assign(new Error(rawError), {
      name: 'ReplyError',
      code: 'ECONNREFUSED',
    });
    const { service } = createService({
      set: jest.fn().mockRejectedValue(redisError),
    });
    const refreshTokensService = (service as any).refreshTokensService;
    refreshTokensService.revokeByAccountId = jest
      .fn()
      .mockResolvedValue(undefined);
    const warn = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();

    await service.logout(accountId, {
      jti: 'sentinel-jti',
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    expect(warn).toHaveBeenCalledWith(
      'operation=redis_token_blacklist outcome=failed error_class=ReplyError error_code=ECONNREFUSED',
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('sentinel-jti');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
