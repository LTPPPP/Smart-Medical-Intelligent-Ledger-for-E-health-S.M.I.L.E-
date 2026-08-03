// GENERATED from Report5_Unit Test.xlsx — sheet "Assign Role" — 7 cases. Do not hand-edit.
//
// Target : UserRolesService.assignRole() — src/user-roles/user-roles.service.ts:17
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 2 DTO-validation (UTCID04,05) / 5 service-behaviour (UTCID01,02,03,06,07)
// Spec   : 3 MATCHES, 4 DIVERGES
//
// How the arguments actually arrive (user-roles.controller.ts:44-50):
//     @Post('user/:userId')
//     assignRole(@Param('userId') userId, @Body() dto: AssignRoleDto)
//       -> this.userRolesService.assignRole(userId, dto.role_id)
//
//   * `userId` is a bare route param with NO pipe (no ParseUUIDPipe anywhere in this
//     controller), so nothing validates it. UTCID02/03 expect BadRequestException for an
//     empty / non-uuid userId; that cannot occur. The value simply reaches the lookup.
//   * `roleId` is NOT a bare argument — it is `role_id` on AssignRoleDto, which really does
//     carry @IsNotEmpty() + @IsUUID(). So UTCID04/05 ARE genuinely reachable, just under the
//     field name `role_id`; the assertions below use the real emitted message.
//   * `assignedBy` is an optional third parameter that the controller NEVER passes and that
//     appears on no DTO, so UTCID06 is unreachable from any real request path.
//
// See docs/audit/uc-divergences.md D10.

import { BadRequestException, ConflictException, ValidationPipe } from '@nestjs/common';

import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRolesService } from './user-roles.service';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

// Mirrors the global pipe in src/main.ts:19-26. iam-service has no utils/validation-options.ts
// to import, so the literal is reproduced here and must be kept in step with main.ts.
const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: AssignRoleDto,
    data: '',
  });
}

/** Invokes the pipe ONCE and returns status + flattened messages (defect T3). */
async function capturePipeRejection(payload: Record<string, unknown>) {
  let caught: unknown;
  let resolved = false;
  try {
    await runPipe(payload);
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) {
    throw new Error('expected ValidationPipe to reject, but it resolved');
  }
  const error = caught as BadRequestException;
  const body = error.getResponse() as { message?: string | string[] };
  const raw = body?.message ?? [];
  return {
    error,
    status: error.getStatus(),
    messages: Array.isArray(raw) ? raw : [raw],
  };
}

const USER_ID = UC_IDS.account;
const ROLE_ID = UC_IDS.role;
const ASSIGNED_BY = UC_IDS.admin;

function createService(existing: unknown = null) {
  const userRoleRepository = {
    findOne: jest.fn().mockResolvedValue(existing),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const roleRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
  };
  const accountsService = { updateRole: jest.fn() };
  const service = new UserRolesService(
    userRoleRepository as any,
    roleRepository as any,
    accountsService as any,
  );
  return { service, userRoleRepository };
}

describe('Assign Role — UserRolesService.assignRole()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is wired and firing. If this fails, every negative assertion
    // in this block is meaningless.
    it('canary — a valid AssignRoleDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ role_id: ROLE_ID })).resolves.toEqual(
        expect.objectContaining({ role_id: ROLE_ID }),
      );
    });

    it('UTCID04 — an empty role_id is rejected as 400 [DIVERGES: SPEC_WRONG — sheet names the field "roleId"; the real body field is role_id]', async () => {
      const { status, messages } = await capturePipeRejection({ role_id: '' });

      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('role_id should not be empty');
    });

    it('UTCID05 — a non-uuid role_id is rejected as 400 [DIVERGES: SPEC_WRONG — sheet names the field "roleId"; the real body field is role_id]', async () => {
      const { status, messages } = await capturePipeRejection({ role_id: UC_MALFORMED_ID });

      expect(status).toBe(400);
      expect(messages).toContain('role_id must be a UUID');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — assigns the role and returns the persisted UserRoleEntity [MATCHES]', async () => {
      const { service, userRoleRepository } = createService(null);

      const result = await service.assignRole(USER_ID, ROLE_ID, ASSIGNED_BY);

      expect(userRoleRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: USER_ID, role_id: ROLE_ID },
      });
      expect(result).toEqual(
        expect.objectContaining({
          user_id: USER_ID,
          role_id: ROLE_ID,
          assigned_by: ASSIGNED_BY,
        }),
      );
      expect(userRoleRepository.save).toHaveBeenCalledTimes(1);
    });

    it('UTCID02 — an empty userId is not validated and the assignment proceeds [DIVERGES: SPEC_WRONG — userId is an unvalidated route param, so "userId should not be empty" cannot occur]', async () => {
      const { service, userRoleRepository } = createService(null);

      const result = await service.assignRole('', ROLE_ID, ASSIGNED_BY);

      expect(result).toEqual(expect.objectContaining({ user_id: '', role_id: ROLE_ID }));
      // Documents the real behaviour: the empty value reached the lookup unchallenged.
      expect(userRoleRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: '', role_id: ROLE_ID },
      });
    });

    it('UTCID03 — a non-uuid userId is not validated and the assignment proceeds [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "userId invalid uuid" cannot occur]', async () => {
      const { service, userRoleRepository } = createService(null);

      const result = await service.assignRole(UC_MALFORMED_ID, ROLE_ID, ASSIGNED_BY);

      expect(result).toEqual(expect.objectContaining({ user_id: UC_MALFORMED_ID }));
      expect(userRoleRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: UC_MALFORMED_ID, role_id: ROLE_ID },
      });
    });

    it('UTCID06 — an empty assignedBy is stored as-is rather than rejected [DIVERGES: SPEC_WRONG — assignedBy is an optional arg the controller never passes and no DTO declares]', async () => {
      const { service } = createService(null);

      const result = await service.assignRole(USER_ID, ROLE_ID, '');

      // `'' ?? null` keeps '' (user-roles.service.ts:27) — no validation, no exception.
      expect(result).toEqual(expect.objectContaining({ assigned_by: '' }));
    });

    it('UTCID07 — assigning a role the user already has throws ConflictException [MATCHES]', async () => {
      const { service, userRoleRepository } = createService({
        id: UC_IDS.session,
        user_id: USER_ID,
        role_id: ROLE_ID,
      });

      let caught: unknown;
      await service
        .assignRole(USER_ID, ROLE_ID, ASSIGNED_BY)
        .catch((error: unknown) => {
          caught = error;
        });

      expect(caught).toBeInstanceOf(ConflictException);
      expect((caught as ConflictException).message).toBe('Role already assigned to this user');
      expect(userRoleRepository.save).not.toHaveBeenCalled();
    });
  });
});
