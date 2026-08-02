// GENERATED from Report5_Unit Test.xlsx — sheet "View Permissions By Role" — 1 case. Do not hand-edit.
//
// Target : PermissionsService.findAll() — src/permissions/permissions.service.ts:55
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 1 service-behaviour
// Spec   : 1 MATCHES, 0 DIVERGES
//
// No canary, deliberately: findAll() takes no arguments at all, so no DTO and no
// ValidationPipe participate in this path and there is nothing for a canary to prove.
//
// Naming note (recorded, not a divergence): the sheet is titled "View Permissions By Role"
// but the symbol map resolves it to findAll(), which lists every permission rather than
// filtering by role. The by-role read is a different method (getPermissionsByRole, exposed at
// permissions.controller.ts:87). The sheet's single case only asserts "returns
// PermissionEntity[] successfully", which findAll() satisfies, so the resolution stands and
// the case is faithful — but the title is looser than the method it maps to.

import { PermissionsService } from './permissions.service';
import { UC_IDS } from '../test-support/uc-fixtures';

function createService(rows: unknown[]) {
  const permissionRepository = {
    find: jest.fn().mockResolvedValue(rows),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const rolePermissionRepository = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const service = new PermissionsService(
    permissionRepository as any,
    rolePermissionRepository as any,
  );
  return { service, permissionRepository };
}

describe('View Permissions By Role — PermissionsService.findAll()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns the permission list ordered by name [MATCHES]', async () => {
      const { service, permissionRepository } = createService([
        {
          permission_id: UC_IDS.permission,
          permission_name: 'medical_record.read',
          resource: 'medical_record',
          action: 'read',
        },
        // Stored with resource/action absent, to exercise the normalise() backfill at
        // permissions.service.ts:27-35.
        {
          permission_id: UC_IDS.otherPermission,
          permission_name: 'appointment.cancel',
          resource: null,
          action: null,
        },
      ]);

      const result = await service.findAll();

      expect(permissionRepository.find).toHaveBeenCalledWith({
        order: { permission_name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({ permission_name: 'medical_record.read' }),
      );
      // resource/action derived from the dotted name when the stored columns are empty.
      expect(result[1]).toEqual(
        expect.objectContaining({
          permission_name: 'appointment.cancel',
          resource: 'appointment',
          action: 'cancel',
        }),
      );
    });
  });
});
