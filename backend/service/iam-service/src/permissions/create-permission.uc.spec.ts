// GENERATED from Report5_Unit Test.xlsx — sheet "Create Permission" — 3 cases. Do not hand-edit.
//
// Target : PermissionsService.create() — src/permissions/permissions.service.ts:37
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 1 DTO-validation (UTCID02) / 2 service-behaviour (UTCID01,03)
// Spec   : 3 MATCHES, 0 DIVERGES — the cleanest sheet in iam-service.
//
// This sheet is well-formed: create() genuinely takes a CreatePermissionDto (arriving via
// @Body() at permissions.controller.ts:65), and permission_name genuinely carries
// @IsNotEmpty(), so UTCID02's expected message is emitted verbatim by the real pipe. UTCID03's
// ConflictException message is templated — `Permission "<name>" already exists` — and the
// sheet's cell holds the leading literal, which the real message starts with.

import { BadRequestException, ConflictException, ValidationPipe } from '@nestjs/common';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';
import { UC_IDS } from '../test-support/uc-fixtures';

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
    metatype: CreatePermissionDto,
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

// The sheet's own values for this case.
const PERMISSION_NAME = 'Nguyen Van A';
const RESOURCE = 'resource-01';
const ACTION = 'action-01';
const DESCRIPTION = 'Routine check-up';

function createService(existing: unknown = null) {
  const permissionRepository = {
    findOne: jest.fn().mockResolvedValue(existing),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
    find: jest.fn(),
  };
  const rolePermissionRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const service = new PermissionsService(
    permissionRepository as any,
    rolePermissionRepository as any,
  );
  return { service, permissionRepository };
}

describe('Create Permission — PermissionsService.create()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is wired and firing. If this fails, the negative assertion
    // below is meaningless.
    it('canary — a valid CreatePermissionDto passes the real ValidationPipe', async () => {
      await expect(
        runPipe({
          permission_name: PERMISSION_NAME,
          resource: RESOURCE,
          action: ACTION,
          description: DESCRIPTION,
        }),
      ).resolves.toEqual(expect.objectContaining({ permission_name: PERMISSION_NAME }));
    });

    it('UTCID02 — an empty permission_name is rejected as 400 with "permission_name should not be empty" [MATCHES]', async () => {
      const { status, messages } = await capturePipeRejection({
        permission_name: '',
        resource: RESOURCE,
        action: ACTION,
        description: DESCRIPTION,
      });

      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('permission_name should not be empty');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — creates the permission and returns the persisted PermissionEntity [MATCHES]', async () => {
      const { service, permissionRepository } = createService(null);

      const result = await service.create({
        permission_name: PERMISSION_NAME,
        resource: RESOURCE,
        action: ACTION,
        description: DESCRIPTION,
      } as CreatePermissionDto);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { permission_name: PERMISSION_NAME },
      });
      expect(result).toEqual(
        expect.objectContaining({
          permission_name: PERMISSION_NAME,
          // Supplied resource/action win over the values derived from the name
          // (permissions.service.ts:48-49).
          resource: RESOURCE,
          action: ACTION,
          description: DESCRIPTION,
        }),
      );
      expect(permissionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('UTCID03 — creating a permission whose name already exists throws ConflictException [MATCHES]', async () => {
      const { service, permissionRepository } = createService({
        permission_id: UC_IDS.permission,
        permission_name: PERMISSION_NAME,
      });

      let caught: unknown;
      await service
        .create({
          permission_name: PERMISSION_NAME,
          resource: RESOURCE,
          action: ACTION,
          description: DESCRIPTION,
        } as CreatePermissionDto)
        .catch((error: unknown) => {
          caught = error;
        });

      expect(caught).toBeInstanceOf(ConflictException);
      // Real message is templated; the sheet's cell holds its leading literal.
      expect((caught as ConflictException).message).toBe(
        `Permission "${PERMISSION_NAME}" already exists`,
      );
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });
  });
});
