// GENERATED from Report5_Unit Test.xlsx — sheet "Signup" — 6 cases. Do not hand-edit.
//
// Target : AuthService.register() — src/auth/auth.service.ts:202  [EXACT]
// Split  : 5 DTO-validation (UTCID02-06) / 1 service-behaviour (UTCID01)
// Spec   : 1 MATCHES, 5 DIVERGES.
//
// AuthRegisterLoginDto carries NO @IsNotEmpty on either email or password — only @IsEmail and
// @MinLength(8). Every "should not be empty" expectation on this sheet therefore names a
// constraint that does not exist; the real rejection comes from the constraint that IS there.
// `gender` is additionally transformed by genderCodeTransformer, which does Number(value):
// the sheet's string labels ("MALE", "UNKNOWN") both become NaN, so the DTO expects ISO-5218
// integer codes (0/1/2) and the sheet's own "valid" gender is not actually valid.
// See docs/audit/uc-divergences.md D4.

import { BadRequestException, HttpException, ValidationPipe } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { GenderEnum } from '../accounts/domain/account';
import { UC_IDS } from '../test-support/uc-fixtures';

// Verbatim copy of the global pipe in src/main.ts:19-26. iam-service has no importable
// validation-options module; this literal MUST be kept in sync with main.ts by hand.
const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: AuthRegisterLoginDto,
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

const ACCOUNT_ID = UC_IDS.account;
const EMAIL = 'nguyen.a@example.com';
const PASSWORD = 'Passw0rd123';

// INFERRED: the sheet's gender column uses labels, but the DTO consumes ISO-5218 codes after
// genderCodeTransformer. GenderEnum.MALE (1) is the code the label "MALE" denotes; used for
// the valid payloads so the canary and DTO cases exercise a genuinely well-formed object.
const INFERRED_VALID_GENDER_CODE = GenderEnum.MALE;

const VALID_PAYLOAD = {
  email: EMAIL,
  password: PASSWORD,
  username: 'nguyenvana01',
  phone: '+84901234567',
  fullName: 'Nguyen Van A',
  gender: INFERRED_VALID_GENDER_CODE,
};

function createService() {
  const accountsService = {
    create: jest.fn().mockResolvedValue({ accountId: ACCOUNT_ID, email: EMAIL }),
  };
  const userProfilesService = { create: jest.fn().mockResolvedValue(undefined) };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('confirm.email.hash') };
  const configService = { get: jest.fn().mockReturnValue('1d') };
  const service = new AuthService(
    jwtService as any,
    accountsService as any,
    { create: jest.fn() } as any,
    {} as any,
    {} as any,
    userProfilesService as any,
    configService as any,
    { set: jest.fn() } as any,
  );
  return { service, accountsService, userProfilesService };
}

describe('Signup — AuthService.register()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    it('canary — a valid AuthRegisterLoginDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ ...VALID_PAYLOAD })).resolves.toEqual(
        expect.objectContaining({ email: EMAIL, password: PASSWORD }),
      );
    });

    it('UTCID02 — malformed email is rejected as 400 with "email must be an email" [MATCHES]', async () => {
      const { error, status, messages } = await capturePipeRejection({
        ...VALID_PAYLOAD,
        email: 'nguyen.a.example.com',
      });
      expect(error).toBeInstanceOf(BadRequestException);
      expect(status).toBe(400);
      expect(messages).toContain('email must be an email');
    });

    it('UTCID03 — empty email is rejected as "email must be an email" [DIVERGES: SPEC_WRONG — no @IsNotEmpty on email, so "email should not be empty" cannot occur]', async () => {
      const { status, messages } = await capturePipeRejection({
        ...VALID_PAYLOAD,
        email: '',
      });
      expect(status).toBe(400);
      expect(messages).toContain('email must be an email');
      expect(messages).not.toContain('email should not be empty');
    });

    it('UTCID04 — short password is rejected with the real @MinLength message [DIVERGES: SPEC_WRONG — sheet paraphrases as "password shorter than 8"]', async () => {
      const { status, messages } = await capturePipeRejection({
        ...VALID_PAYLOAD,
        password: 'Pass1',
      });
      expect(status).toBe(400);
      expect(messages).toContain(
        'password must be longer than or equal to 8 characters',
      );
    });

    it('UTCID05 — empty password is rejected by @MinLength, not by an emptiness rule [DIVERGES: SPEC_WRONG — no @IsNotEmpty on password]', async () => {
      const { status, messages } = await capturePipeRejection({
        ...VALID_PAYLOAD,
        password: '',
      });
      expect(status).toBe(400);
      expect(messages).toContain(
        'password must be longer than or equal to 8 characters',
      );
      expect(messages).not.toContain('password should not be empty');
    });

    it('UTCID06 — a non-numeric gender label becomes NaN and fails @IsInt/@IsIn [DIVERGES: SPEC_WRONG — sheet paraphrases as "gender not in enum"; the DTO takes ISO-5218 codes, not labels]', async () => {
      const { status, messages } = await capturePipeRejection({
        ...VALID_PAYLOAD,
        gender: 'UNKNOWN',
      });
      expect(status).toBe(400);
      // Number('UNKNOWN') === NaN, so both integer and membership constraints reject it.
      expect(messages.join(' | ')).toContain('gender must be');
      expect(messages).not.toContain('gender not in enum');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — valid registration creates the account and its profile [MATCHES]', async () => {
      const { service, accountsService, userProfilesService } = createService();

      const result = await service.register({ ...VALID_PAYLOAD } as AuthRegisterLoginDto);

      expect(accountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: EMAIL, password: PASSWORD }),
      );
      expect(userProfilesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: EMAIL }),
        ACCOUNT_ID,
      );
      expect(result).toEqual(
        expect.objectContaining({ message: expect.stringContaining('Registration successful') }),
      );
    });
  });
});
