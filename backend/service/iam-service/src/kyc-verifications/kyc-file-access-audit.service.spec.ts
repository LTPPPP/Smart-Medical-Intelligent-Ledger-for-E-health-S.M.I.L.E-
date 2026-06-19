import { KycFileAccessAuditService } from './kyc-file-access-audit.service';

describe('KycFileAccessAuditService', () => {
  it('logs KYC file view without exposing raw identity data', async () => {
    const auditLogs = { create: jest.fn(async (dto) => dto) };
    const service = new KycFileAccessAuditService(auditLogs as any);

    await service.logView({
      actorUserId: 'admin-id',
      kycId: 'kyc-id',
      kind: 'idFront',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(auditLogs.create).toHaveBeenCalledWith({
      user_id: 'admin-id',
      action: 'KYC_FILE_VIEWED',
      resource: 'kyc_file',
      resource_id: 'kyc-id',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: { kind: 'idFront' },
    });
  });
});
