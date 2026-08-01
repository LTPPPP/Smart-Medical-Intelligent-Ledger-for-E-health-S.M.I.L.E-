// GENERATED from Report5_Unit Test.xlsx — sheet "Reset Password" — 4 cases. Do not hand-edit.
//
// Target : AuthService.resetPassword() — src/auth/auth.service.ts:303  [EXACT]
// Split  : 0 DTO-validation / 4 service-behaviour
// Spec   : 2 MATCHES, 2 DIVERGES.
//
// resetPassword() takes two bare string arguments (hash, password), not a DTO, so no
// ValidationPipe participates and there is no pipe canary to write. UTCID02 and UTCID03 both
// claim DTO-level emptiness rules that consequently cannot fire.
// See docs/audit/uc-divergences.md D7.

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
const VALID_HASH = 'hash-01';
const INVALID_HASH = 'existing-value';
const NEW_PASSWORD = 'Passw0rd123';

/**
 * @param verifies  whether jwtService.verifyAsync accepts the hash
 * @param account   what accountsService.findById resolves to
 */
function createService(options: { verifies: boolean; account?: unknown }) {
  const jwtService = {
    verifyAsync: options.verifies
      ? jest.fn().mockResolvedValue({ forgotAccountId: ACCOUNT_ID })
      : jest.fn().mockRejectedValue(new Error('invalid signature')),
  };
  const accountsService = {
    findById: jest.fn().mockResolvedValue(
      options.account === undefined ? { accountId: ACCOUNT_ID } : options.account,
    ),
    update: jest.fn().mockResolvedValue({ accountId: ACCOUNT_ID }),
  };
  const refreshTokensService = { revokeByAccountId: jest.fn().mockResolvedValue(undefined) };
  const service = new AuthService(
    jwtService as any,
    accountsService as any,
    refreshTokensService as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn() } as any,
    {} as any,
  );
  return { service, jwtService, accountsService, refreshTokensService };
}

describe('Reset Password — AuthService.resetPassword()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — a valid hash updates the password and revokes refresh tokens [MATCHES]', async () => {
      const { service, accountsService, refreshTokensService } = createService({
        verifies: true,
      });

      const result = await service.resetPassword(VALID_HASH, NEW_PASSWORD);

      expect(accountsService.update).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.objectContaining({ password: NEW_PASSWORD }),
      );
      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result).toEqual(
        expect.objectContaining({ message: expect.stringContaining('Password reset') }),
      );
    });

    it('UTCID02 — an empty hash fails signature verification and throws invalidHash [DIVERGES: SPEC_WRONG — hash is a bare string argument, never DTO-validated]', async () => {
      const { service } = createService({ verifies: false });

      const rejection = await captureRejection(() => service.resetPassword('', NEW_PASSWORD));

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({ response: { errors: { hash: 'invalidHash' } } });
    });

    it('UTCID03 — an empty password is accepted and written through; no emptiness rule exists [DIVERGES: SPEC_WRONG — sheet expects BadRequestException "password should not be empty"]', async () => {
      const { service, accountsService } = createService({ verifies: true });

      // The method performs NO validation on `password`; it forwards whatever it is given.
      const result = await service.resetPassword(VALID_HASH, '');

      expect(accountsService.update).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.objectContaining({ password: '' }),
      );
      expect(result).toEqual(
        expect.objectContaining({ message: expect.stringContaining('Password reset') }),
      );
    });

    it('UTCID04 — an unverifiable hash throws invalidHash [MATCHES]', async () => {
      const { service } = createService({ verifies: false });

      const rejection = await captureRejection(() =>
        service.resetPassword(INVALID_HASH, NEW_PASSWORD),
      );

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({ response: { errors: { hash: 'invalidHash' } } });
    });
  });
});
