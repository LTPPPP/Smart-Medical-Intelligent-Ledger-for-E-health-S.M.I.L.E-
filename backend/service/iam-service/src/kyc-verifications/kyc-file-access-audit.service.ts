import { Injectable } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { KycFileKind } from './kyc-file-storage.service';

@Injectable()
export class KycFileAccessAuditService {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async logView(input: {
    actorUserId: string;
    kycId: string;
    kind: KycFileKind;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.auditLogsService.create({
      user_id: input.actorUserId,
      action: 'KYC_FILE_VIEWED',
      resource: 'kyc_file',
      resource_id: input.kycId,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      details: { kind: input.kind },
    });
  }
}
