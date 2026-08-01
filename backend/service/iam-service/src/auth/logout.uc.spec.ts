// GENERATED from Report5_Unit Test.xlsx — sheet "Logout" — 4 cases. Do not hand-edit.
//
// Target : AuthService.logout() — src/auth/auth.service.ts:434  [EXACT]
// Split  : 0 DTO-validation / 4 service-behaviour
// Spec   : 1 MATCHES, 3 DIVERGES.
//
// logout(accountId, accessToken?) takes bare arguments, not a DTO, and returns void. It
// performs NO validation and NO existence check — it revokes refresh tokens unconditionally
// and blacklists the access-token jti when one is supplied. All three of the sheet's
// BadRequestException cases therefore describe rejections that cannot occur: the method
// simply succeeds. See docs/audit/uc-divergences.md D8.

import { AuthService } from './auth.service';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const ACCOUNT_ID = UC_IDS.account;
const JTI = UC_IDS.session;

function createService() {
  const refreshTokensService = { revokeByAccountId: jest.fn().mockResolvedValue(undefined) };
  const redis = { set: jest.fn().mockResolvedValue('OK') };
  const configService = { get: jest.fn().mockReturnValue('15m') };
  const service = new AuthService(
    {} as any,
    {} as any,
    refreshTokensService as any,
    {} as any,
    {} as any,
    {} as any,
    configService as any,
    redis as any,
  );
  return { service, refreshTokensService, redis };
}

describe('Logout — AuthService.logout()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — revokes refresh tokens and blacklists the access-token jti [MATCHES]', async () => {
      const { service, refreshTokensService, redis } = createService();

      await expect(
        service.logout(ACCOUNT_ID, { jti: JTI, exp: Math.floor(Date.now() / 1000) + 900 }),
      ).resolves.toBeUndefined();

      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(JTI),
        'logout',
        'EX',
        expect.any(Number),
      );
    });

    it('UTCID02 — an empty accountId still succeeds; no emptiness rule exists [DIVERGES: SPEC_WRONG — accountId is a bare argument, never DTO-validated]', async () => {
      const { service, refreshTokensService } = createService();

      await expect(
        service.logout('', { jti: JTI, exp: Math.floor(Date.now() / 1000) + 900 }),
      ).resolves.toBeUndefined();

      // Proves the value was forwarded rather than rejected.
      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith('');
    });

    it('UTCID03 — a malformed accountId still succeeds; there is no uuid check [DIVERGES: SPEC_WRONG — sheet expects BadRequestException "accountId invalid uuid"]', async () => {
      const { service, refreshTokensService } = createService();

      await expect(
        service.logout(UC_MALFORMED_ID, { jti: JTI, exp: Math.floor(Date.now() / 1000) + 900 }),
      ).resolves.toBeUndefined();

      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith(UC_MALFORMED_ID);
    });

    it('UTCID04 — an absent access token skips blacklisting and still succeeds [DIVERGES: SPEC_WRONG — sheet expects BadRequestException "accessToken should not be empty"]', async () => {
      const { service, refreshTokensService, redis } = createService();

      await expect(service.logout(ACCOUNT_ID, undefined)).resolves.toBeUndefined();

      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith(ACCOUNT_ID);
      // No jti supplied => nothing to blacklist; the guard at auth.service.ts:462 skips it.
      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
