// GENERATED from Report5_Unit Test.xlsx — sheet "Verify Identity KYC (Phone Numb" — 3 cases. Do not hand-edit.
//
// (The sheet name is truncated in the workbook itself — Excel caps tab names at 31 chars.)
//
// Target : KycVerificationsService.findMine() — src/kyc-verifications/kyc-verifications.service.ts:140
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 3 service-behaviour
// Spec   : 1 MATCHES, 2 DIVERGES
//
// No canary, deliberately: findMine(userId) takes a single bare string — no DTO, no
// ValidationPipe in this path for a canary to prove.
//
// UTCID02/03 expect BadRequestException for an empty / non-uuid userId. findMine never throws
// at all: on a miss it returns a NOT_SUBMITTED KycResponseDto telling the caller to upload
// their ID (kyc-verifications.service.ts:142-147). An unknown user is a normal, non-error
// state here. See docs/audit/uc-divergences.md D21.

import { KycVerificationsService } from './kyc-verifications.service';
import { KycStatus } from './entities/kyc-verification.entity';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const USER_ID = UC_IDS.account;

function createService(latest: unknown) {
  const kycRepository = {
    findOne: jest.fn().mockResolvedValue(latest),
    find: jest.fn(),
    save: jest.fn(),
  };
  const accountRepository = { findOne: jest.fn() };
  const fileStorage = { store: jest.fn(), remove: jest.fn() };
  const ocrService = { extract: jest.fn() };
  const auditLogsService = { create: jest.fn() };
  const service = new KycVerificationsService(
    kycRepository as any,
    accountRepository as any,
    fileStorage as any,
    ocrService as any,
    auditLogsService as any,
  );
  return { service, kycRepository };
}

describe('Verify Identity KYC — KycVerificationsService.findMine()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns the caller latest KYC record as a KycResponseDto [MATCHES]', async () => {
      const { service, kycRepository } = createService({
        kyc_id: UC_IDS.kycVerification,
        user_id: USER_ID,
        verification_status: KycStatus.VERIFIED,
      });

      const result = await service.findMine(USER_ID);

      // Latest-first lookup scoped to the caller (kyc-verifications.service.ts:378-382).
      expect(kycRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: USER_ID },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(expect.objectContaining({ status: KycStatus.VERIFIED }));
    });

    it('UTCID02 — an empty userId returns the NOT_SUBMITTED response rather than throwing [DIVERGES: SPEC_WRONG — findMine takes a bare argument, validates nothing, and treats "no record" as a normal state]', async () => {
      const { service, kycRepository } = createService(null);

      const result = await service.findMine('');

      expect(result).toEqual(
        expect.objectContaining({
          status: KycStatus.NOT_SUBMITTED,
          statusMessage: 'Upload your citizen ID to verify your identity.',
        }),
      );
      // Documents the real cause: the empty value reached the lookup and matched nothing.
      expect(kycRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: '' },
        order: { created_at: 'DESC' },
      });
    });

    it('UTCID03 — a non-uuid userId returns the NOT_SUBMITTED response rather than throwing [DIVERGES: SPEC_WRONG — no ParseUUIDPipe or DTO on this path]', async () => {
      const { service, kycRepository } = createService(null);

      const result = await service.findMine(UC_MALFORMED_ID);

      expect(result).toEqual(
        expect.objectContaining({ status: KycStatus.NOT_SUBMITTED }),
      );
      expect(kycRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: UC_MALFORMED_ID },
        order: { created_at: 'DESC' },
      });
    });
  });
});
