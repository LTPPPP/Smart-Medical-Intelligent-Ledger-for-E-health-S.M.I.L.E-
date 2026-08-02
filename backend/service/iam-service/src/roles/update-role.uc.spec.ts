// GENERATED from Report5_Unit Test.xlsx — sheet "Update Role" — 3 cases. Do not hand-edit.
//
// Target : RolesService.update() — src/roles/roles.service.ts:55
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 3 service-behaviour
// Spec   : 1 MATCHES, 2 DIVERGES
//
// No canary, deliberately: update(id, updateData) takes a bare string and a
// `Partial<RoleEntity>` — not a validated DTO — so no ValidationPipe participates at this
// layer and there is nothing for a canary to prove.
//
// Both negative cases expect BadRequestException, and neither can occur:
//   * `id` is a bare argument (route param, no pipe). A miss returns null, it does not throw.
//   * `updateData` empty cannot be rejected either. Even one layer up at the controller,
//     UpdateRoleDto declares every property @IsOptional(), so `{}` is a VALID body by
//     construction — "updateData should not be empty" is unreachable by design.
// See docs/audit/uc-divergences.md D17.

import { RolesService } from './roles.service';
import { UC_IDS } from '../test-support/uc-fixtures';

const ROLE_ID = UC_IDS.role;

function createService(existing: unknown) {
  const roleRepository = {
    findOne: jest.fn().mockResolvedValue(existing),
    save: jest.fn((value) => Promise.resolve(value)),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const service = new RolesService(roleRepository as any);
  return { service, roleRepository };
}

function existingRole() {
  return {
    role_id: ROLE_ID,
    role_name: 'DOCTOR',
    description: 'Clinical staff',
  };
}

describe('Update Role — RolesService.update()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — merges the update into the existing role and saves it [MATCHES]', async () => {
      const { service, roleRepository } = createService(existingRole());

      const result = await service.update(ROLE_ID, { role_name: 'SENIOR_DOCTOR' } as any);

      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { role_id: ROLE_ID } });
      expect(result).toEqual(
        expect.objectContaining({
          role_id: ROLE_ID,
          role_name: 'SENIOR_DOCTOR',
          // Untouched fields survive the Object.assign (roles.service.ts:58).
          description: 'Clinical staff',
        }),
      );
      expect(roleRepository.save).toHaveBeenCalledTimes(1);
    });

    it('UTCID02 — an empty id resolves to null instead of throwing [DIVERGES: SPEC_WRONG — id is an unvalidated argument, and a miss returns null rather than raising BadRequestException]', async () => {
      const { service, roleRepository } = createService(null);

      const result = await service.update('', { role_name: 'SENIOR_DOCTOR' } as any);

      expect(result).toBeNull();
      // Documents the real cause: the empty value reached the lookup and matched nothing.
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { role_id: '' } });
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('UTCID03 — an empty updateData is accepted and the role is saved unchanged [DIVERGES: SPEC_WRONG — UpdateRoleDto has only @IsOptional() fields, so an empty body is valid by construction]', async () => {
      const { service, roleRepository } = createService(existingRole());

      const result = await service.update(ROLE_ID, {} as any);

      expect(result).toEqual(expect.objectContaining(existingRole()));
      // No exception — the save still happens, it simply changes nothing.
      expect(roleRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
