// GENERATED from Report5_Unit Test.xlsx — sheet "Update Role Permissions" — 7 cases. Do not hand-edit.
//
// Target : PermissionsService.assignPermissionToRole() — src/permissions/permissions.service.ts:78
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 2 DTO-validation (UTCID04,05) / 5 service-behaviour (UTCID01,02,03,06,07)
// Spec   : 3 MATCHES, 4 DIVERGES
//
// How the arguments actually arrive (permissions.controller.ts:96-113):
//     @Post('role/:roleId')
//     assignToRole(@Param('roleId') roleId, @Body() dto: AssignPermissionDto)
//       -> this.permissionsService.assignPermissionToRole(roleId, dto.permission_id)
//
//   * `roleId` is a bare route param with no pipe, so UTCID02/03 cannot produce the
//     BadRequestException they expect.
//   * `permissionId` is really `permission_id` on AssignPermissionDto, which carries
//     @IsNotEmpty() + @IsUUID() — so UTCID04/05 ARE reachable, under the real field name.
//   * `assignedBy` is an optional third parameter the controller never passes, so UTCID06 is
//     unreachable from any request path.
//
// Same shape as the "Assign Role" sheet. See docs/audit/uc-divergences.md D12.

import { BadRequestException, ConflictException, ValidationPipe } from '@nestjs/common';

import { AssignPermissionDto } from './dto/assign-permission.dto';
import { PermissionsService } from './permissions.service';
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
    metatype: AssignPermissionDto,
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

const ROLE_ID = UC_IDS.role;
const PERMISSION_ID = UC_IDS.permission;
const ASSIGNED_BY = UC_IDS.admin;

function createService(existing: unknown = null) {
  const permissionRepository = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const rolePermissionRepository = {
    findOne: jest.fn().mockResolvedValue(existing),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const service = new PermissionsService(
    permissionRepository as any,
    rolePermissionRepository as any,
  );
  return { service, rolePermissionRepository };
}

describe('Update Role Permissions — PermissionsService.assignPermissionToRole()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is wired and firing. If this fails, every negative assertion
    // in this block is meaningless.
    it('canary — a valid AssignPermissionDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ permission_id: PERMISSION_ID })).resolves.toEqual(
        expect.objectContaining({ permission_id: PERMISSION_ID }),
      );
    });

    it('UTCID04 — an empty permission_id is rejected as 400 [DIVERGES: SPEC_WRONG — sheet names the field "permissionId"; the real body field is permission_id]', async () => {
      const { status, messages } = await capturePipeRejection({ permission_id: '' });

      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('permission_id should not be empty');
    });

    it('UTCID05 — a non-uuid permission_id is rejected as 400 [DIVERGES: SPEC_WRONG — sheet names the field "permissionId"; the real body field is permission_id]', async () => {
      const { status, messages } = await capturePipeRejection({ permission_id: UC_MALFORMED_ID });

      expect(status).toBe(400);
      expect(messages).toContain('permission_id must be a UUID');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — assigns the permission and returns the persisted RolePermissionEntity [MATCHES]', async () => {
      const { service, rolePermissionRepository } = createService(null);

      const result = await service.assignPermissionToRole(ROLE_ID, PERMISSION_ID, ASSIGNED_BY);

      expect(rolePermissionRepository.findOne).toHaveBeenCalledWith({
        where: { role_id: ROLE_ID, permission_id: PERMISSION_ID },
      });
      expect(result).toEqual(
        expect.objectContaining({
          role_id: ROLE_ID,
          permission_id: PERMISSION_ID,
          assigned_by: ASSIGNED_BY,
        }),
      );
      expect(rolePermissionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('UTCID02 — an empty roleId is not validated and the assignment proceeds [DIVERGES: SPEC_WRONG — roleId is an unvalidated route param, so "roleId should not be empty" cannot occur]', async () => {
      const { service, rolePermissionRepository } = createService(null);

      const result = await service.assignPermissionToRole('', PERMISSION_ID, ASSIGNED_BY);

      expect(result).toEqual(expect.objectContaining({ role_id: '', permission_id: PERMISSION_ID }));
      expect(rolePermissionRepository.findOne).toHaveBeenCalledWith({
        where: { role_id: '', permission_id: PERMISSION_ID },
      });
    });

    it('UTCID03 — a non-uuid roleId is not validated and the assignment proceeds [DIVERGES: SPEC_WRONG — no ParseUUIDPipe on this route, so "roleId invalid uuid" cannot occur]', async () => {
      const { service, rolePermissionRepository } = createService(null);

      const result = await service.assignPermissionToRole(UC_MALFORMED_ID, PERMISSION_ID, ASSIGNED_BY);

      expect(result).toEqual(expect.objectContaining({ role_id: UC_MALFORMED_ID }));
      expect(rolePermissionRepository.findOne).toHaveBeenCalledWith({
        where: { role_id: UC_MALFORMED_ID, permission_id: PERMISSION_ID },
      });
    });

    it('UTCID06 — an empty assignedBy is stored as-is rather than rejected [DIVERGES: SPEC_WRONG — assignedBy is an optional arg the controller never passes and no DTO declares]', async () => {
      const { service } = createService(null);

      const result = await service.assignPermissionToRole(ROLE_ID, PERMISSION_ID, '');

      // `'' ?? null` keeps '' (permissions.service.ts:88) — no validation, no exception.
      expect(result).toEqual(expect.objectContaining({ assigned_by: '' }));
    });

    it('UTCID07 — assigning a permission the role already has throws ConflictException [MATCHES]', async () => {
      const { service, rolePermissionRepository } = createService({
        id: UC_IDS.session,
        role_id: ROLE_ID,
        permission_id: PERMISSION_ID,
      });

      let caught: unknown;
      await service
        .assignPermissionToRole(ROLE_ID, PERMISSION_ID, ASSIGNED_BY)
        .catch((error: unknown) => {
          caught = error;
        });

      expect(caught).toBeInstanceOf(ConflictException);
      expect((caught as ConflictException).message).toBe(
        'Permission already assigned to this role',
      );
      expect(rolePermissionRepository.save).not.toHaveBeenCalled();
    });
  });
});
