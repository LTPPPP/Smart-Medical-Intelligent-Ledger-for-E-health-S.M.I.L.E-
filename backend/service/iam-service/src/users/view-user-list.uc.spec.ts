// GENERATED from Report5_Unit Test.xlsx — sheet "View User List" — 1 case. Do not hand-edit.
//
// Target : UserProfilesService.findAll() — src/users/user-profiles.service.ts:36
// Symbol : MISMAPPED (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 1 service-behaviour
// Spec   : 0 MATCHES, 1 DIVERGES — a 100%-divergence sheet.
//
// The sheet names PermissionsService.findAll() and declares the return type as
// `PermissionEntity[]`. That method lists permission records and has nothing to do with users.
// The real user-list read is UserProfilesService.findAll(query) via GET /user-profiles, and it
// returns `{ data: UserProfileEntity[]; total: number }` — a paged envelope, not a bare array.
// Both the class and the return shape in the sheet are wrong.
// See docs/audit/uc-divergences.md D19.

import { UserProfilesService } from './user-profiles.service';
import { UC_IDS } from '../test-support/uc-fixtures';

function createService(rows: unknown[], total: number) {
  const userProfileRepository = {
    findAndCount: jest.fn().mockResolvedValue([rows, total]),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const service = new UserProfilesService(userProfileRepository as any);
  return { service, userProfileRepository };
}

describe('View User List — UserProfilesService.findAll()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns a paged { data, total } envelope of user profiles [DIVERGES: SPEC_WRONG — sheet names PermissionsService.findAll() and expects PermissionEntity[]]', async () => {
      const rows = [
        { user_id: UC_IDS.userProfile, full_name: 'Nguyen Van A' },
        { user_id: UC_IDS.patient, full_name: 'Zoe Truong' },
      ];
      const { service, userProfileRepository } = createService(rows, 2);

      const result = await service.findAll({} as any);

      // Defaults when the query omits them: page 1, limit 10, skip 0
      // (user-profiles.service.ts:37-39).
      expect(userProfileRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          order: { created_at: 'DESC' },
        }),
      );
      // The real envelope — not the bare PermissionEntity[] the sheet describes.
      expect(result).toEqual({ data: rows, total: 2 });
      expect(result).not.toHaveProperty('permission_id');
      expect(Array.isArray(result)).toBe(false);
    });
  });
});
