// GENERATED from Report5_Unit Test.xlsx — sheet "Forgot Password" — 3 cases. Do not hand-edit.
//
// Target : AuthService.forgotPassword() — src/auth/auth.service.ts:274  [EXACT]
// Split  : 0 DTO-validation / 3 service-behaviour
// Spec   : 2 MATCHES, 1 DIVERGES.
//
// forgotPassword() takes a bare `email: string`, not a DTO, so no ValidationPipe participates
// and this file has no DTO-validation block (and therefore no pipe canary — there is no pipe
// to prove). UTCID02's "email should not be empty" cannot occur for that reason.
// See docs/audit/uc-divergences.md D6.

import { UnprocessableEntityException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UC_IDS } from '../test-support/uc-fixtures';

/** Invokes the method under test exactly once and returns what it threw (defect T3). */
async function captureRejection(run: () => Promise<unknown>): Promise<unknown> {
  let caught: unknown;
  let resolved = false;
  try {
    await run();
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) throw new Error('expected the call to reject, but it resolved');
  return caught;
}

const ACCOUNT_ID = UC_IDS.account;
const KNOWN_EMAIL = 'nguyen.a@example.com';
const UNKNOWN_EMAIL = 'existing.user@example.com';

const OTP_CODE = '123456';
const OTP_TTL_MINUTES = 15;

function createService(account: unknown) {
  const accountsService = { findByEmail: jest.fn().mockResolvedValue(account) };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('forgot.hash') };
  const configService = { get: jest.fn().mockReturnValue('30m') };
  const otpTokensService = {
    create: jest.fn().mockResolvedValue({
      otpCode: OTP_CODE,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    }),
  };
  const mailService = { sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined) };
  // The service chains .catch() onto every redis call (auth.service.ts:311,325,327,353,357),
  // so each mock must return a real promise. exists=0 -> not on cooldown; incr=1 -> first
  // send this hour, which is also what triggers the expire() call.
  const redis = {
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };
  const service = new AuthService(
    jwtService as any,
    accountsService as any,
    {} as any,
    {} as any,
    otpTokensService as any,
    {} as any,
    configService as any,
    mailService as any,
    redis as any,
  );
  return { service, accountsService, jwtService, otpTokensService, mailService, redis };
}

describe('Forgot Password — AuthService.forgotPassword()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — a known email issues a one-time code by email and returns the confirmation message [MATCHES]', async () => {
      const { service, accountsService, otpTokensService, mailService, redis } =
        createService({ accountId: ACCOUNT_ID, email: KNOWN_EMAIL });

      const result = await service.forgotPassword(KNOWN_EMAIL);

      expect(accountsService.findByEmail).toHaveBeenCalledWith(KNOWN_EMAIL);
      // Cooldown is checked before anything is issued (auth.service.ts:311).
      expect(redis.exists).toHaveBeenCalledTimes(1);
      expect(otpTokensService.create).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.anything(),
      );
      expect(mailService.sendPasswordResetOtp).toHaveBeenCalledWith({
        to: KNOWN_EMAIL,
        otp: OTP_CODE,
        expiresInMinutes: OTP_TTL_MINUTES,
      });
      expect(result).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('password reset code'),
        }),
      );
    });

    it('UTCID02 — an empty email resolves to no account and throws emailNotExists [DIVERGES: SPEC_WRONG — email is a bare string argument, never DTO-validated, so "email should not be empty" cannot occur]', async () => {
      const { service, accountsService } = createService(null);

      const rejection = await captureRejection(() => service.forgotPassword(''));

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({
        response: { errors: { email: 'emailNotExists' } },
      });
      // Documents the real cause: the value reached the lookup and simply matched nothing.
      expect(accountsService.findByEmail).toHaveBeenCalledWith('');
    });

    it('UTCID03 — an unregistered email throws emailNotExists [MATCHES]', async () => {
      const { service } = createService(null);

      const rejection = await captureRejection(() => service.forgotPassword(UNKNOWN_EMAIL));

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({
        response: { errors: { email: 'emailNotExists' } },
      });
    });
  });
});
