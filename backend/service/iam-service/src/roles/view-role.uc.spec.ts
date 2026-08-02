// GENERATED from Report5_Unit Test.xlsx — sheet "View Role" — 1 case. Do not hand-edit.
//
// Target : RolesService.findAll() — src/roles/roles.service.ts:34
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 1 service-behaviour
// Spec   : 1 MATCHES, 0 DIVERGES
//
// No canary: findAll(query) receives a QueryRoleDto whose fields are all optional, and this
// sheet has no negative case, so no ValidationPipe behaviour is under test here.

import { RolesService } from './roles.service';
import { UC_IDS } from '../test-support/uc-fixtures';

const SEARCH = 'search-01';

function createService(rows: unknown[], total: number) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
  };
  const roleRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const service = new RolesService(roleRepository as any);
  return { service, roleRepository, qb };
}

describe('View Role — RolesService.findAll()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — returns a paged RolesPageResult and applies the search filter [MATCHES]', async () => {
      const rows = [
        { role_id: UC_IDS.role, role_name: 'DOCTOR', description: 'Clinical staff' },
        { role_id: UC_IDS.otherRole, role_name: 'ADMIN', description: 'Administrator' },
      ];
      const { service, qb } = createService(rows, 2);

      const result = await service.findAll({ search: SEARCH } as any);

      // Search is applied as a single ILIKE parameter across both columns
      // (roles.service.ts:40-43).
      expect(qb.where).toHaveBeenCalledWith(
        'r.role_name ILIKE :search OR r.description ILIKE :search',
        { search: `%${SEARCH}%` },
      );
      // Defaults when the query omits them: page 1, limit 10, skip 0 (roles.service.ts:35-37).
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.orderBy).toHaveBeenCalledWith('r.created_at', 'DESC');
      expect(result).toEqual({ data: rows, total: 2, page: 1, limit: 10 });
    });
  });
});
