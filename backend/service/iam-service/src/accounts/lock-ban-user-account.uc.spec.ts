// GENERATED from Report5_Unit Test.xlsx — sheet "Lock-Ban User Account" — 5 cases. Do not hand-edit.
//
// Target : AccountsService.lockAccount() — src/accounts/accounts.service.ts:119
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 1 DTO-validation (UTCID04) / 4 service-behaviour (UTCID01,02,03,05)
// Spec   : 2 MATCHES, 3 DIVERGES
//
// How the arguments actually arrive (accounts.controller.ts:214-224):
//     @Post(':id/lock')
//     lockAccount(@Param('id') id, @Body() dto: LockAccountDto, @Request() request)
//       -> this.accountsService.lockAccount(id, dto.reason, request.user.accountId)
//
// LockAccountDto declares exactly ONE property, `reason` (@IsNotEmpty() @IsString()). So:
//   * UTCID04 is genuinely reachable and its expected message is emitted verbatim — MATCHES.
//   * UTCID02/03 target `accountId`, which is a bare route param with no pipe.
//   * UTCID05 targets `lockedBy`, which is not user input at all — it is taken from the
//     authenticated admin's own session (`request.user.accountId`), so a caller can never
//     submit it empty.
// This confirms the earlier audit finding that the sheet asserts DTO validation on two fields
// that are not DTO fields. See docs/audit/uc-divergences.md D13.

import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { AccountStatus } from './domain/account';
import { LockAccountDto } from './dto/lock-account.dto';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

// Mirrors the global pipe in src/main.ts:19-26. iam-service has no utils/validation-options.ts
// to import, so the literal is reproduced here and must be kept in step with main.ts.
const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: LockAccountDto,
    data: '',
  });
}

/** Invokes the pipe ONCE and returns status + flattened messages (defect T3). */
async function capturePipeRejection(payload: Record<string, unknown>) {
  let caught: unknown;
  let resolved = false;
  try {
    await runPipe(payload);
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) {
    throw new Error('expected ValidationPipe to reject, but it resolved');
  }
  const error = caught as BadRequestException;
  const body = error.getResponse() as { message?: string | string[] };
  const raw = body?.message ?? [];
  return {
    error,
    status: error.getStatus(),
    messages: Array.isArray(raw) ? raw : [raw],
  };
}

const ACCOUNT_ID = UC_IDS.account;
const REASON = 'Routine check-up';
const LOCKED_BY = UC_IDS.admin;

function createService() {
  const accountsRepository = { update: jest.fn().mockResolvedValue(undefined) };
  const otpTokensService = { create: jest.fn() };
  const service = new AccountsService(
    accountsRepository as any,
    otpTokensService as any,
  );
  return { service, accountsRepository };
}

describe('Lock-Ban User Account — AccountsService.lockAccount()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is wired and firing. If this fails, the negative assertion
    // below is meaningless.
    it('canary — a valid LockAccountDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ reason: REASON })).resolves.toEqual(
        expect.objectContaining({ reason: REASON }),
      );
    });

    it('UTCID04 — an empty reason is rejected as 400 with "reason should not be empty" [MATCHES]', async () => {
      const { status, messages } = await capturePipeRejection({ reason: '' });

      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('reason should not be empty');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — locks the account and resolves void [MATCHES]', async () => {
      const { service, accountsRepository } = createService();

      await expect(
        service.lockAccount(ACCOUNT_ID, REASON, LOCKED_BY),
      ).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.objectContaining({
          status: AccountStatus.LOCKED,
          lockedReason: REASON,
          lockedBy: LOCKED_BY,
          lockedAt: expect.any(Date),
        }),
      );
    });

    it('UTCID02 — an empty accountId is not validated and the update still runs [DIVERGES: SPEC_WRONG — accountId is an unvalidated route param, not a field on LockAccountDto]', async () => {
      const { service, accountsRepository } = createService();

      await expect(service.lockAccount('', REASON, LOCKED_BY)).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('UTCID03 — a non-uuid accountId is not validated and the update still runs [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "accountId invalid uuid" cannot occur]', async () => {
      const { service, accountsRepository } = createService();

      await expect(
        service.lockAccount(UC_MALFORMED_ID, REASON, LOCKED_BY),
      ).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith(
        UC_MALFORMED_ID,
        expect.any(Object),
      );
    });

    it('UTCID05 — an empty lockedBy is persisted as-is rather than rejected [DIVERGES: SPEC_WRONG — lockedBy is taken from the authenticated admin session, not from caller input, and is not a LockAccountDto field]', async () => {
      const { service, accountsRepository } = createService();

      await expect(service.lockAccount(ACCOUNT_ID, REASON, '')).resolves.toBeUndefined();

      expect(accountsRepository.update).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.objectContaining({ lockedBy: '' }),
      );
    });
  });
});
