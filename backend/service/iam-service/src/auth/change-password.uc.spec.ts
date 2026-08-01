// GENERATED from Report5_Unit Test.xlsx — sheet "Change Password" — 8 cases. Do not hand-edit.
//
// Target : AuthService.update() — src/auth/auth.service.ts:347  [EXACT]
// Split  : 2 DTO-validation (UTCID04,05) / 6 service-behaviour (UTCID01,02,03,06,07,08)
// Spec   : 3 MATCHES, 5 DIVERGES.
//
// `accountId` is a METHOD ARGUMENT, not a property of AuthUpdateDto, so UTCID02/03's claimed
// DTO validation cannot occur. UTCID06 expects `missingOldPassword` but supplies a non-empty
// oldPassword, which the code routes to the compare() branch instead. UTCID07 and UTCID08 are
// byte-identical duplicates. See docs/audit/uc-divergences.md D5.

import {
  BadRequestException,
  HttpException,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { hash } from 'bcryptjs';

import { AuthService } from './auth.service';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

// Verbatim copy of the global pipe in src/main.ts:19-26 — kept in sync by hand.
const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: AuthUpdateDto,
    data: '',
  });
}

async function capturePipeRejection(payload: Record<string, unknown>) {
  let caught: unknown;
  let resolved = false;
  try {
    await runPipe(payload);
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) throw new Error('expected ValidationPipe to reject, but it resolved');
  const httpError = caught as HttpException;
  const body = httpError.getResponse() as { message?: string | string[] };
  const raw = body?.message ?? [];
  return {
    error: httpError,
    status: httpError.getStatus(),
    messages: Array.isArray(raw) ? raw : [raw],
  };
}

/** Invokes the method under test exactly once and returns what it threw (defect T3). */
async function captureRejection(run: () => Promise<unknown>): Promise<unknown> {
  let caught: unknown;
  let resolved = false;
  try {
    await run();
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) throw new Error('expected the call to reject, but it resolved');
  return caught;
}

const ACCOUNT_ID = UC_IDS.account;
const EMAIL = 'nguyen.a@example.com';
const NEW_PASSWORD = 'Passw0rd123';
const CORRECT_OLD_PASSWORD = 'Passw0rd123';
const WRONG_OLD_PASSWORD = 'WrongPass123';

// Real bcrypt, hashed ONCE per file and reused — never inside an it().
let currentPasswordHash: string;

beforeAll(async () => {
  currentPasswordHash = await hash(CORRECT_OLD_PASSWORD, 4);
});

const VALID_UPDATE_PAYLOAD = {
  username: 'nguyenvana01',
  email: EMAIL,
  phone: '+84901234567',
  password: NEW_PASSWORD,
  oldPassword: CORRECT_OLD_PASSWORD,
};

function createService(account: unknown) {
  const accountsService = {
    findById: jest.fn().mockResolvedValue(account),
    update: jest.fn().mockResolvedValue({
      accountId: ACCOUNT_ID,
      email: EMAIL,
      passwordHash: 'rehashed',
    }),
  };
  const refreshTokensService = { revokeByAccountId: jest.fn().mockResolvedValue(undefined) };
  const service = new AuthService(
    { signAsync: jest.fn() } as any,
    accountsService as any,
    refreshTokensService as any,
    {} as any,
    {} as any,
    { findById: jest.fn() } as any,
    { get: jest.fn() } as any,
    { set: jest.fn() } as any,
  );
  return { service, accountsService, refreshTokensService };
}

function createAccount(overrides: Record<string, unknown> = {}) {
  return {
    accountId: ACCOUNT_ID,
    email: EMAIL,
    passwordHash: currentPasswordHash,
    ...overrides,
  };
}

describe('Change Password — AuthService.update()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    it('canary — a valid AuthUpdateDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ ...VALID_UPDATE_PAYLOAD })).resolves.toEqual(
        expect.objectContaining({ email: EMAIL, password: NEW_PASSWORD }),
      );
    });

    it('UTCID04 — malformed email is rejected as 400 with "email must be an email" [MATCHES]', async () => {
      const { error, status, messages } = await capturePipeRejection({
        ...VALID_UPDATE_PAYLOAD,
        email: 'nguyen.a.example.com',
      });
      expect(error).toBeInstanceOf(BadRequestException);
      expect(status).toBe(400);
      expect(messages).toContain('email must be an email');
    });

    it('UTCID05 — short password is rejected with the real @MinLength message [DIVERGES: SPEC_WRONG — sheet paraphrases as "password shorter than 8"]', async () => {
      const { status, messages } = await capturePipeRejection({
        ...VALID_UPDATE_PAYLOAD,
        password: 'Pass1',
      });
      expect(status).toBe(400);
      expect(messages).toContain(
        'password must be longer than or equal to 8 characters',
      );
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — correct old password updates the account and revokes refresh tokens [MATCHES]', async () => {
      const { service, accountsService, refreshTokensService } = createService(createAccount());

      const result = await service.update(ACCOUNT_ID, {
        ...VALID_UPDATE_PAYLOAD,
      } as AuthUpdateDto);

      expect(refreshTokensService.revokeByAccountId).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(accountsService.update).toHaveBeenCalledWith(ACCOUNT_ID, expect.any(Object));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('UTCID02 — empty accountId resolves to no account and throws accountNotFound [DIVERGES: SPEC_WRONG — accountId is a method argument, never DTO-validated]', async () => {
      const { service, accountsService } = createService(null);

      const rejection = await captureRejection(() =>
        service.update('', { ...VALID_UPDATE_PAYLOAD } as AuthUpdateDto),
      );

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({
        response: { errors: { account: 'accountNotFound' } },
      });
      expect(accountsService.findById).toHaveBeenCalledWith('');
    });

    it('UTCID03 — malformed accountId resolves to no account and throws accountNotFound [DIVERGES: SPEC_WRONG — there is no uuid check on accountId]', async () => {
      const { service } = createService(null);

      const rejection = await captureRejection(() =>
        service.update(UC_MALFORMED_ID, { ...VALID_UPDATE_PAYLOAD } as AuthUpdateDto),
      );

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({
        response: { errors: { account: 'accountNotFound' } },
      });
    });

    it('UTCID06 — a supplied-but-wrong oldPassword yields incorrectOldPassword, not missingOldPassword [DIVERGES: SPEC_WRONG — missingOldPassword requires an ABSENT oldPassword, but the sheet supplies one]', async () => {
      const { service } = createService(createAccount());

      const rejection = await captureRejection(() =>
        service.update(ACCOUNT_ID, {
          ...VALID_UPDATE_PAYLOAD,
          oldPassword: WRONG_OLD_PASSWORD,
        } as AuthUpdateDto),
      );

      expect(rejection).toMatchObject({
        response: { errors: { oldPassword: 'incorrectOldPassword' } },
      });
      // The path the sheet actually named is only reachable with oldPassword omitted:
      const missing = await captureRejection(() =>
        service.update(ACCOUNT_ID, { password: NEW_PASSWORD } as AuthUpdateDto),
      );
      expect(missing).toMatchObject({
        response: { errors: { oldPassword: 'missingOldPassword' } },
      });
    });

    it('UTCID07 — wrong old password throws incorrectOldPassword [MATCHES]', async () => {
      const { service } = createService(createAccount());

      const rejection = await captureRejection(() =>
        service.update(ACCOUNT_ID, {
          ...VALID_UPDATE_PAYLOAD,
          oldPassword: WRONG_OLD_PASSWORD,
        } as AuthUpdateDto),
      );

      expect(rejection).toBeInstanceOf(UnprocessableEntityException);
      expect(rejection).toMatchObject({
        response: { errors: { oldPassword: 'incorrectOldPassword' } },
      });
    });

    // UTCID08 is byte-identical to UTCID07 on the source sheet. Reproduced faithfully rather
    // than reinterpreted — see docs/audit/uc-divergences.md D5.3.
    it('UTCID08 — wrong old password throws incorrectOldPassword [DIVERGES: SPEC_WRONG — byte-identical duplicate of UTCID07]', async () => {
      const { service } = createService(createAccount());

      const rejection = await captureRejection(() =>
        service.update(ACCOUNT_ID, {
          ...VALID_UPDATE_PAYLOAD,
          oldPassword: WRONG_OLD_PASSWORD,
        } as AuthUpdateDto),
      );

      expect(rejection).toMatchObject({
        response: { errors: { oldPassword: 'incorrectOldPassword' } },
      });
    });
  });
});
