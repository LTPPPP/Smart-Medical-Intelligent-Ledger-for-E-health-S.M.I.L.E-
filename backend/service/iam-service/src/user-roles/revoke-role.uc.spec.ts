// GENERATED from Report5_Unit Test.xlsx — sheet "Revoke Role" — 5 cases. Do not hand-edit.
//
// Target : UserRolesService.revokeRole() — src/user-roles/user-roles.service.ts:33
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 5 service-behaviour
// Spec   : 1 MATCHES, 4 DIVERGES
//
// No canary in this file, deliberately: revokeRole takes two bare strings and the route
// (user-roles.controller.ts:63-70, @Delete('user/:userId/role/:roleId')) carries NO body DTO
// and NO ParseUUIDPipe. There is no ValidationPipe in this path to prove, so a canary would
// be theatre.
//
// Consequently UTCID02-05 — which all expect BadRequestException for empty / non-uuid
// identifiers — assert behaviour that cannot occur. `revokeRole` performs an unconditional
// repository delete and resolves to undefined whether or not anything matched; TypeORM's
// delete() is not an existence check. See docs/audit/uc-divergences.md D11.

import { UserRolesService } from './user-roles.service';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const USER_ID = UC_IDS.account;
const ROLE_ID = UC_IDS.role;

function createService(affected = 1) {
  const userRoleRepository = {
    delete: jest.fn().mockResolvedValue({ affected, raw: [] }),
  };
  const roleRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
  };
  const accountsService = { findById: jest.fn(), updateRole: jest.fn() };
  const service = new UserRolesService(
    userRoleRepository as any,
    roleRepository as any,
    accountsService as any,
  );
  return { service, userRoleRepository };
}

describe('Revoke Role — UserRolesService.revokeRole()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — revokes the role and resolves void [MATCHES]', async () => {
      const { service, userRoleRepository } = createService();

      await expect(service.revokeRole(USER_ID, ROLE_ID)).resolves.toBeUndefined();

      expect(userRoleRepository.delete).toHaveBeenCalledWith({
        user_id: USER_ID,
        role_id: ROLE_ID,
      });
    });

    it('UTCID02 — an empty userId is not validated and the delete still runs [DIVERGES: SPEC_WRONG — userId is an unvalidated route param, so "userId should not be empty" cannot occur]', async () => {
      const { service, userRoleRepository } = createService(0);

      await expect(service.revokeRole('', ROLE_ID)).resolves.toBeUndefined();

      expect(userRoleRepository.delete).toHaveBeenCalledWith({
        user_id: '',
        role_id: ROLE_ID,
      });
    });

    it('UTCID03 — a non-uuid userId is not validated and the delete still runs [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "userId invalid uuid" cannot occur]', async () => {
      const { service, userRoleRepository } = createService(0);

      await expect(service.revokeRole(UC_MALFORMED_ID, ROLE_ID)).resolves.toBeUndefined();

      expect(userRoleRepository.delete).toHaveBeenCalledWith({
        user_id: UC_MALFORMED_ID,
        role_id: ROLE_ID,
      });
    });

    it('UTCID04 — an empty roleId is not validated and the delete still runs [DIVERGES: SPEC_WRONG — roleId is an unvalidated route param, not a DTO field on this route]', async () => {
      const { service, userRoleRepository } = createService(0);

      await expect(service.revokeRole(USER_ID, '')).resolves.toBeUndefined();

      expect(userRoleRepository.delete).toHaveBeenCalledWith({
        user_id: USER_ID,
        role_id: '',
      });
    });

    it('UTCID05 — a non-uuid roleId is not validated and the delete still runs [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "roleId invalid uuid" cannot occur]', async () => {
      const { service, userRoleRepository } = createService(0);

      await expect(service.revokeRole(USER_ID, UC_MALFORMED_ID)).resolves.toBeUndefined();

      expect(userRoleRepository.delete).toHaveBeenCalledWith({
        user_id: USER_ID,
        role_id: UC_MALFORMED_ID,
      });
    });
  });
});
