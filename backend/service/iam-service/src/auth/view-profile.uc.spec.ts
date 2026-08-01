// GENERATED from Report5_Unit Test.xlsx — sheet "View Profile" — 2 cases. Do not hand-edit.
//
// Target : AuthService.me() — src/auth/auth.service.ts:343
// Symbol : MISMAPPED (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 2 service-behaviour
// Spec   : 0 MATCHES, 2 DIVERGES — a 100%-divergence sheet.
//
// The sheet names KycVerificationsService.findOne() and expects a KycVerificationEntity. The
// real profile read is AuthService.me(accountId), which returns the caller's Account with the
// password hash stripped, or null when no such account exists. It takes a bare string, not a
// DTO, so UTCID02's "id should not be empty" cannot occur — and me() does not throw at all on
// a miss, it returns null. See docs/audit/uc-divergences.md D9.

import { AuthService } from './auth.service';
import { UC_IDS } from '../test-support/uc-fixtures';

const ACCOUNT_ID = UC_IDS.account;
const EMAIL = 'nguyen.a@example.com';

function createService(account: unknown) {
  const accountsService = { findById: jest.fn().mockResolvedValue(account) };
  const service = new AuthService(
    {} as any,
    accountsService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  return { service, accountsService };
}

describe('View Profile — AuthService.me()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns the caller Account with the password hash stripped [DIVERGES: SPEC_WRONG — sheet expects a KycVerificationEntity]', async () => {
      const { service, accountsService } = createService({
        accountId: ACCOUNT_ID,
        email: EMAIL,
        passwordHash: 'should-never-be-returned',
      });

      const result = await service.me(ACCOUNT_ID);

      expect(accountsService.findById).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result).toEqual(
        expect.objectContaining({ accountId: ACCOUNT_ID, email: EMAIL }),
      );
      // auth.service.ts:352 strips the hash before returning.
      expect(result).not.toHaveProperty('passwordHash');
      // Real return shape — nothing resembling the KycVerificationEntity the sheet expects.
      expect(result).not.toHaveProperty('kyc_id');
    });

    it('UTCID02 — an empty id returns null rather than throwing [DIVERGES: SPEC_WRONG — sheet expects BadRequestException "id should not be empty"; me() neither validates nor throws]', async () => {
      const { service, accountsService } = createService(null);

      const result = await service.me('');

      expect(result).toBeNull();
      // Documents the real cause: the value reached the lookup and simply matched nothing.
      expect(accountsService.findById).toHaveBeenCalledWith('');
    });
  });
});
