import { UnauthorizedException } from '@nestjs/common';
import { AccountStatus } from '../../accounts/domain/account';
import { JwtStrategy } from './jwt.strategy';

const activeAccount = {
  accountId: 'account-1',
  email: 'patient@example.test',
  role: 'PATIENT',
  status: AccountStatus.ACTIVE,
};

function createStrategy(
  overrides: {
    account?: unknown;
    blacklisted?: number;
  } = {},
) {
  const findById = jest
    .fn()
    .mockResolvedValue(
      'account' in overrides ? overrides.account : activeAccount,
    );
  const exists = jest.fn().mockResolvedValue(overrides.blacklisted ?? 0);
  process.env.AUTH_JWT_SECRET = 'test-secret';

  return {
    strategy: new JwtStrategy(
      {} as any,
      { findById } as any,
      { exists } as any,
    ),
    findById,
    exists,
  };
}

const payload = () =>
  ({
    accountId: 'account-1',
    jti: 'jti-1',
    exp: Math.floor(Date.now() / 1000) + 60,
  }) as any;

describe('JwtStrategy.validate', () => {
  it('accepts an active account with a non-blacklisted token', async () => {
    const { strategy } = createStrategy();

    await expect(strategy.validate(payload())).resolves.toMatchObject({
      accountId: 'account-1',
      role: 'PATIENT',
      status: AccountStatus.ACTIVE,
    });
  });

  it('rejects a token with no jti, which could never be revoked', async () => {
    const { strategy, exists } = createStrategy();

    await expect(
      strategy.validate({ accountId: 'account-1' } as any),
    ).rejects.toThrow(UnauthorizedException);
    expect(exists).not.toHaveBeenCalled();
  });

  it('rejects a blacklisted token', async () => {
    const { strategy } = createStrategy({ blacklisted: 1 });

    await expect(strategy.validate(payload())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when the account no longer exists', async () => {
    const { strategy } = createStrategy({ account: null });

    await expect(strategy.validate(payload())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([
    AccountStatus.LOCKED,
    AccountStatus.SUSPENDED,
    AccountStatus.DEACTIVATED,
  ])('rejects a %s account holding a still-valid token', async (status) => {
    const { strategy } = createStrategy({
      account: { ...activeAccount, status },
    });

    await expect(strategy.validate(payload())).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
