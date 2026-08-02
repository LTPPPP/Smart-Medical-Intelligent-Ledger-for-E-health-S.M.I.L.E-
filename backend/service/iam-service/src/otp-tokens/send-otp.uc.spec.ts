// GENERATED from Report5_Unit Test.xlsx — sheet "Send OTP" — 4 cases. Do not hand-edit.
//
// Target : OtpTokensService.create() — src/otp-tokens/otp-tokens.service.ts:31
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 4 service-behaviour
// Spec   : 1 MATCHES, 3 DIVERGES
//
// No canary, deliberately: create(accountId, otpType) takes two bare arguments. There is no
// DTO and therefore no ValidationPipe in this path for a canary to prove.
//
// UTCID02-04 all expect BadRequestException for empty / non-uuid values, but nothing between
// the caller and the repository inspects either argument — the method generates a code, works
// out an expiry, and persists whatever it was handed. See docs/audit/uc-divergences.md D16.

import { OtpTokensService } from './otp-tokens.service';
import { OtpType } from './domain/otp-token';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const ACCOUNT_ID = UC_IDS.account;
// INFERRED: the sheet's placeholder "otpType-01" is not a member of the OtpType union
// (which is LOGIN | PASSWORD_RESET | IDENTITY_VERIFY). The only defensible reading is the
// value the send-otp path actually issues — accounts.service.ts:173-175 and :187 both call
// otpTokensService.create(..., OtpType.IDENTITY_VERIFY) for phone verification.
const INFERRED_OTP_TYPE = OtpType.IDENTITY_VERIFY;

function createService() {
  const otpTokensRepository = {
    create: jest.fn((value) => Promise.resolve({ otpTokenId: UC_IDS.otpToken, ...value })),
  };
  const configService = { get: jest.fn() };
  const service = new OtpTokensService(
    otpTokensRepository as any,
    configService as any,
  );
  return { service, otpTokensRepository };
}

describe('Send OTP — OtpTokensService.create()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — issues a six-digit OTP with a future expiry and persists it [MATCHES]', async () => {
      const { service, otpTokensRepository } = createService();
      const before = Date.now();

      const result = await service.create(ACCOUNT_ID, INFERRED_OTP_TYPE);

      expect(otpTokensRepository.create).toHaveBeenCalledTimes(1);
      const persisted = otpTokensRepository.create.mock.calls[0][0];
      expect(persisted.accountId).toBe(ACCOUNT_ID);
      expect(persisted.otpType).toBe(INFERRED_OTP_TYPE);
      // generateOtpCode() is 100000..999999 (otp-tokens.service.ts:56).
      expect(persisted.otpCode).toMatch(/^\d{6}$/);
      expect(persisted.expiresAt.getTime()).toBeGreaterThan(before);
      expect(result).toEqual(expect.objectContaining({ accountId: ACCOUNT_ID }));
    });

    it('UTCID02 — an empty accountId is not validated and the token is still issued [DIVERGES: SPEC_WRONG — accountId is a bare argument; no DTO or pipe guards it]', async () => {
      const { service, otpTokensRepository } = createService();

      const result = await service.create('', INFERRED_OTP_TYPE);

      expect(result).toEqual(expect.objectContaining({ accountId: '' }));
      expect(otpTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: '' }),
      );
    });

    it('UTCID03 — a non-uuid accountId is not validated and the token is still issued [DIVERGES: SPEC_WRONG — no ParseUUIDPipe or DTO on this path]', async () => {
      const { service, otpTokensRepository } = createService();

      const result = await service.create(UC_MALFORMED_ID, INFERRED_OTP_TYPE);

      expect(result).toEqual(expect.objectContaining({ accountId: UC_MALFORMED_ID }));
      expect(otpTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: UC_MALFORMED_ID }),
      );
    });

    it('UTCID04 — an empty otpType is not validated and is persisted as-is [DIVERGES: SPEC_WRONG — otpType is a bare argument, and TypeScript enums are not enforced at runtime]', async () => {
      const { service, otpTokensRepository } = createService();

      const result = await service.create(ACCOUNT_ID, '' as OtpType);

      expect(result).toEqual(expect.objectContaining({ otpType: '' }));
      expect(otpTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ otpType: '' }),
      );
    });
  });
});
