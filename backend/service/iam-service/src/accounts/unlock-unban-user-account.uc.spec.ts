// GENERATED from Report5_Unit Test.xlsx — sheet "Unlock-Unban User Account" — 3 cases. Do not hand-edit.
//
// Target : AccountsService.unlockAccount() — src/accounts/accounts.service.ts:128
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 3 service-behaviour
// Spec   : 1 MATCHES, 2 DIVERGES
//
// No canary, deliberately: the route (accounts.controller.ts:239-245,
// @Post(':id/unlock')) carries NO body DTO and NO ParseUUIDPipe — `@Param('id') id: string`
// is the only input. There is no ValidationPipe in this path to prove.
//
// So UTCID02/03, which expect BadRequestException for an empty / non-uuid accountId, assert
// behaviour that cannot occur. unlockAccount() performs an unconditional repository update
// and resolves to undefined regardless of whether any row matched.
// See docs/audit/uc-divergences.md D14.

import { AccountsService } from './accounts.service';
import { AccountStatus } from './domain/account';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const ACCOUNT_ID = UC_IDS.account;

function createService() {
  const accountsRepository = { update: jest.fn().mockResolvedValue(undefined) };
  const otpTokensService = { create: jest.fn() };
  const service = new AccountsService(
    accountsRepository as any,
    otpTokensService as any,
  );
  return { service, accountsRepository };
}

describe('Unlock-Unban User Account — AccountsService.unlockAccount()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — unlocks the account, clearing every lock field, and resolves void [MATCHES]', async () => {
      const { service, accountsRepository } = createService();

      await expect(service.unlockAccount(ACCOUNT_ID)).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith(ACCOUNT_ID, {
        status: AccountStatus.ACTIVE,
        lockedAt: null,
        lockedReason: null,
        lockedBy: null,
        // Unlocking also resets the counter that caused the lock (accounts.service.ts:134).
        failedLoginAttempts: 0,
      });
    });

    it('UTCID02 — an empty accountId is not validated and the update still runs [DIVERGES: SPEC_WRONG — accountId is an unvalidated route param and this route has no body DTO at all]', async () => {
      const { service, accountsRepository } = createService();

      await expect(service.unlockAccount('')).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('UTCID03 — a non-uuid accountId is not validated and the update still runs [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "accountId invalid uuid" cannot occur]', async () => {
      const { service, accountsRepository } = createService();

      await expect(service.unlockAccount(UC_MALFORMED_ID)).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith(
        UC_MALFORMED_ID,
        expect.any(Object),
      );
    });
  });
});
