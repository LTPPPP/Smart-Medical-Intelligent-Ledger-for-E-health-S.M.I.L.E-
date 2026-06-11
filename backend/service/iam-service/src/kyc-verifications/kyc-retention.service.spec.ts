import { KycRetentionService } from './kyc-retention.service';

describe('KycRetentionService', () => {
  it('deletes expired KYC files and marks the record deleted', async () => {
    const expired = {
      kyc_id: 'kyc-id',
      user_id: 'user-id',
      id_front_image: 'front.enc',
      id_back_image: 'back.enc',
      selfie_image: 'selfie.enc',
      retention_expires_at: new Date('2026-01-01T00:00:00Z'),
      deleted_at: null,
    };
    const repo = {
      find: jest.fn(async () => [expired]),
      save: jest.fn(async (value) => value),
    };
    const storage = { deleteMany: jest.fn(async () => undefined) };
    const auditLogs = { create: jest.fn(async (dto) => dto) };
    const service = new KycRetentionService(repo as any, storage as any, auditLogs as any);

    const deleted = await service.cleanupExpired(new Date('2026-02-01T00:00:00Z'));

    expect(deleted).toBe(1);
    expect(storage.deleteMany).toHaveBeenCalledWith(['front.enc', 'back.enc', 'selfie.enc']);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(Date),
        id_front_image: null,
        id_back_image: null,
        selfie_image: null,
      }),
    );
    expect(auditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'KYC_FILES_DELETED' }),
    );
  });
});
