// GENERATED from Report5_Unit Test.xlsx — sheet "Access Audit Log" — 1 case. Do not hand-edit.
//
// Target : AuditLogsService.findAll() — src/audit-logs/audit-logs.service.ts:35
// Symbol : MISMAPPED (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 1 service-behaviour
// Spec   : 0 MATCHES, 1 DIVERGES — a 100%-divergence sheet.
//
// The sheet names PermissionsService.findAll() and declares the return type as
// `PermissionEntity[]`. That method lists permission records and has nothing to do with audit
// logging. The real audit-log read is AuditLogsService.findAll(query) via GET /audit-logs, and
// it returns `{ data: AuditLogWithUser[]; total: number }` — each row joined to the actor's
// display name. Both the class and the return shape in the sheet are wrong.
// See docs/audit/uc-divergences.md D20.

import { AuditLogsService } from './audit-logs.service';
import { UC_IDS } from '../test-support/uc-fixtures';

function createService(rows: any[], total: number, profiles: unknown[]) {
  const auditLogRepository = {
    findAndCount: jest.fn().mockResolvedValue([rows, total]),
    create: jest.fn(),
    save: jest.fn(),
  };
  const userProfileRepository = {
    findBy: jest.fn().mockResolvedValue(profiles),
  };
  const service = new AuditLogsService(
    auditLogRepository as any,
    userProfileRepository as any,
  );
  return { service, auditLogRepository, userProfileRepository };
}

describe('Access Audit Log — AuditLogsService.findAll()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns a paged { data, total } envelope with each row joined to its actor name [DIVERGES: SPEC_WRONG — sheet names PermissionsService.findAll() and expects PermissionEntity[]]', async () => {
      const rows = [
        {
          log_id: UC_IDS.auditLog,
          user_id: UC_IDS.userProfile,
          action: 'LOGIN',
          resource: 'account',
        },
        // A system-generated row with no actor, to exercise the null branch of the join.
        { log_id: UC_IDS.session, user_id: null, action: 'CRON', resource: 'system' },
      ];
      const { service, auditLogRepository, userProfileRepository } = createService(
        rows,
        2,
        [{ user_id: UC_IDS.userProfile, full_name: 'Nguyen Van A' }],
      );

      const result = await service.findAll({} as any);

      // Defaults when the query omits them: page 1, limit 20, skip 0
      // (audit-logs.service.ts:36-38).
      expect(auditLogRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          order: { created_at: 'DESC' },
        }),
      );
      // Only rows carrying a user_id are looked up (audit-logs.service.ts:56).
      expect(userProfileRepository.findBy).toHaveBeenCalledTimes(1);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(
        expect.objectContaining({ action: 'LOGIN', full_name: 'Nguyen Van A' }),
      );
      // The actor-less row still comes back, with a null name rather than being dropped.
      expect(result.data[1]).toEqual(
        expect.objectContaining({ action: 'CRON', full_name: null }),
      );
      // The real envelope — not the bare PermissionEntity[] the sheet describes.
      expect(Array.isArray(result)).toBe(false);
    });
  });
});
