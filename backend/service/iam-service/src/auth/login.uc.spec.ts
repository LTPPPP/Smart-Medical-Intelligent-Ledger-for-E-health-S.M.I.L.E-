// GENERATED from Report5_Unit Test.xlsx — sheet "Login" — 7 cases. Do not hand-edit.
//
// Target : AuthService.validateLogin() — src/auth/auth.service.ts:52
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 3 DTO-validation cases (UTCID02,03,04) / 4 service-behaviour cases (UTCID01,05,06,07)
// Spec   : 6 of 7 MATCHES, 1 of 7 DIVERGES (UTCID07, a duplicate — see uc-divergences.md D1.1)
//
// iam-service is the one service group where the sheet's BadRequestException/400 expectation
// is CORRECT: it uses the stock ValidationPipe, unlike clinical-emr and payment which are
// configured for 422.

import {
  BadRequestException,
  HttpException,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { hash } from 'bcryptjs';

import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AccountStatus, RoleEnum } from '../accounts/domain/account';
// Distinct id per entity kind, guarded against collision at import time (defect T1).
import { UC_IDS } from '../test-support/uc-fixtures';

// iam-service has NO src/utils/validation-options.ts to import — its pipe is declared inline
// in src/main.ts:19-26. This literal is a verbatim copy of that declaration and MUST be kept
// in sync with it by hand; there is no shared options object to depend on, and main.ts is not
// to be refactored to create one.
const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: AuthEmailLoginDto,
    data: '',
  });
}

/** Runs the pipe and returns the rejection's HTTP status + body, or fails if it resolves. */
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
  const httpError = caught as HttpException;
  const body = httpError.getResponse() as { message?: string | string[] };
  const raw = body?.message ?? [];
  return {
    error: httpError,
    status: httpError.getStatus(),
    body,
    messages: Array.isArray(raw) ? raw : [raw],
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACCOUNT_ID = UC_IDS.account;
const EMAIL = 'nguyen.a@example.com';
const GOOD_PASSWORD = 'Passw0rd123';
const WRONG_PASSWORD = 'WrongPass123';

// Real bcrypt, hashed ONCE per file and reused by every case — never inside an it().
// compare() is therefore genuine cryptography, not a mock, at a cost of one hash per file.
let goodPasswordHash: string;

beforeAll(async () => {
  goodPasswordHash = await hash(GOOD_PASSWORD, 4);
});

// --- Inferred mock state (rule D: every inference named and sourced) ---

// INFERRED from UTCID05's expected message `accountIs${account.status}`: the case is only
// reachable when status !== ACTIVE (auth.service.ts:64). The sheet has no column for account
// status, but the guard admits exactly one class of value, so no second reading is defensible.
// LOCKED is chosen as the representative non-ACTIVE status.
const INFERRED_NON_ACTIVE_STATUS = AccountStatus.LOCKED;

// INFERRED from UTCID01's "success" plus the Precondition "User account already exists and is
// active": the happy path requires an ACTIVE account whose passwordHash matches the input.
const INFERRED_ACTIVE_STATUS = AccountStatus.ACTIVE;

function createAccount(overrides: Record<string, unknown> = {}) {
  return {
    accountId: ACCOUNT_ID,
    email: EMAIL,
    role: RoleEnum.PATIENT,
    status: INFERRED_ACTIVE_STATUS,
    passwordHash: goodPasswordHash,
    failedLoginAttempts: 0,
    ...overrides,
  };
}

function createService(account: unknown) {
  const accountsService = {
    findByEmail: jest.fn().mockResolvedValue(account),
    updateFailedLoginAttempts: jest.fn().mockResolvedValue(undefined),
    lockAccount: jest.fn().mockResolvedValue(undefined),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
  };
  // signAsync is called twice: access token, then refresh token (auth.service.ts:491,527).
  const jwtService = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('signed.jwt.token')
      .mockResolvedValue('signed.refresh.token'),
  };
  const refreshTokensService = {
    create: jest.fn().mockResolvedValue(undefined),
    findByTokenHash: jest.fn().mockResolvedValue({ tokenId: 'refresh-token-id' }),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const oAuthConnectionsService = { findByProviderAndUserId: jest.fn() };
  const otpTokensService = { create: jest.fn() };
  const userProfilesService = {
    findById: jest.fn().mockResolvedValue({ accountId: ACCOUNT_ID, fullName: 'Nguyen A' }),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'auth.expires') return '15m';
      if (key === 'auth.refreshExpires') return '7d';
      if (key === 'auth.secret') return 'test-secret';
      if (key === 'auth.refreshSecret') return 'test-refresh-secret';
      return undefined;
    }),
  };
  const redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };

  const service = new AuthService(
    jwtService as any,
    accountsService as any,
    refreshTokensService as any,
    oAuthConnectionsService as any,
    otpTokensService as any,
    userProfilesService as any,
    configService as any,
    redis as any,
  );

  return { service, accountsService, userProfilesService };
}

// ---------------------------------------------------------------------------

describe('Login — AuthService.validateLogin()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is actually wired and firing. If this fails, every negative
    // assertion in this describe block is meaningless.
    it('canary — a valid AuthEmailLoginDto passes the real ValidationPipe', async () => {
      await expect(
        runPipe({ email: EMAIL, password: GOOD_PASSWORD }),
      ).resolves.toEqual(
        expect.objectContaining({ email: EMAIL, password: GOOD_PASSWORD }),
      );
    });

    it('UTCID02 — malformed email is rejected as 400 with "email must be an email" [MATCHES]', async () => {
      const { error, status, messages } = await capturePipeRejection({
        email: 'nguyen.a.example.com',
        password: GOOD_PASSWORD,
      });

      expect(error).toBeInstanceOf(BadRequestException);
      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('email must be an email');
    });

    it('UTCID03 — empty email is rejected as 400 with "email should not be empty" [MATCHES]', async () => {
      const { error, status, messages } = await capturePipeRejection({
        email: '',
        password: GOOD_PASSWORD,
      });

      expect(error).toBeInstanceOf(BadRequestException);
      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('email should not be empty');
    });

    it('UTCID04 — empty password is rejected as 400 with "password should not be empty" [MATCHES]', async () => {
      const { error, status, messages } = await capturePipeRejection({
        email: EMAIL,
        password: '',
      });

      expect(error).toBeInstanceOf(BadRequestException);
      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('password should not be empty');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — valid credentials on an active account return a LoginResponseDto [MATCHES]', async () => {
      const { service, accountsService, userProfilesService } = createService(createAccount());

      const result = await service.validateLogin({
        email: EMAIL,
        password: GOOD_PASSWORD,
      } as AuthEmailLoginDto);

      expect(accountsService.findByEmail).toHaveBeenCalledWith(EMAIL);
      expect(accountsService.updateLastLogin).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(userProfilesService.findById).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result).toEqual(
        expect.objectContaining({
          token: 'signed.jwt.token',
          refreshToken: 'signed.refresh.token',
          tokenExpires: expect.any(Number),
          user: expect.objectContaining({ accountId: ACCOUNT_ID, email: EMAIL }),
        }),
      );
      // The password hash must never be serialized back to the caller (auth.service.ts:113).
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('UTCID05 — non-active account throws UnprocessableEntityException accountIs<status> [MATCHES]', async () => {
      const { service } = createService(
        createAccount({ status: INFERRED_NON_ACTIVE_STATUS }),
      );

      const promise = service.validateLogin({
        email: EMAIL,
        password: GOOD_PASSWORD,
      } as AuthEmailLoginDto);

      await expect(promise).rejects.toBeInstanceOf(UnprocessableEntityException);
      // The sheet quotes the source expression `accountIs${account.status}` verbatim; the code
      // emits it interpolated (auth.service.ts:68). Asserted resolved, not as a literal.
      await expect(promise).rejects.toMatchObject({
        response: {
          status: 422,
          errors: { account: `accountIs${INFERRED_NON_ACTIVE_STATUS}` },
        },
      });
    });

    it('UTCID06 — wrong password throws UnprocessableEntityException incorrectPassword [MATCHES]', async () => {
      const { service, accountsService } = createService(createAccount());

      const promise = service.validateLogin({
        email: EMAIL,
        password: WRONG_PASSWORD,
      } as AuthEmailLoginDto);

      await expect(promise).rejects.toBeInstanceOf(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({
        response: { status: 422, errors: { password: 'incorrectPassword' } },
      });
      // Failed-attempt counter increments on every wrong password (auth.service.ts:85-86).
      expect(accountsService.updateFailedLoginAttempts).toHaveBeenCalledWith(ACCOUNT_ID, 1);
    });

    // UTCID07 is byte-identical to UTCID06 on the source sheet — same email, same password,
    // same expected exception and message. Reproduced faithfully rather than reinterpreted:
    // inventing a distinction the sheet does not make would be fabricating a test case.
    // See docs/audit/uc-divergences.md D1.1 (SPEC_WRONG — duplicate, zero added coverage).
    it('UTCID07 — wrong password throws UnprocessableEntityException incorrectPassword [DIVERGES: SPEC_WRONG — byte-identical duplicate of UTCID06]', async () => {
      const { service } = createService(createAccount());

      const promise = service.validateLogin({
        email: EMAIL,
        password: WRONG_PASSWORD,
      } as AuthEmailLoginDto);

      await expect(promise).rejects.toBeInstanceOf(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({
        response: { status: 422, errors: { password: 'incorrectPassword' } },
      });
    });
  });
});
