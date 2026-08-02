// GENERATED from Report5_Unit Test.xlsx — sheet "Login with Google" — 5 cases. Do not hand-edit.
//
// Target : AuthGoogleService.validateLogin() — src/auth-google/auth-google.service.ts:17
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 1 DTO-validation (UTCID02) / 4 service-behaviour (UTCID01,03,04,05)
// Spec   : 2 MATCHES, 3 DIVERGES
//
// The method has two sequential strategies and BOTH internal `throw new Error(...)` calls are
// swallowed by their own bare `catch {}` (auth-google.service.ts:41, 67):
//
//     try  { verifyIdToken(); if (!payload) throw new Error('Invalid Google token'); ... }
//     catch { /* fall through to the access-token fallback */ }
//     try  { fetch(userinfo); if (!res.ok) throw new Error('Invalid Google access token'); ... }
//     catch { throw new UnauthorizedException('Invalid Google token'); }
//
// So neither raw `Error` can ever reach a caller. UTCID03 and UTCID04 name those internal
// errors as the observable outcome; in reality every failure path — bad id-token, bad access
// token, network failure — collapses to the SAME UnauthorizedException('Invalid Google token')
// that UTCID05 already covers. Three sheet rows therefore describe one observable behaviour.
//
// `fetch` is the bare global (no injected HTTP client), so it is stubbed per-test and restored
// afterwards. See docs/audit/uc-divergences.md D15.

import { BadRequestException, UnauthorizedException, ValidationPipe } from '@nestjs/common';

import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

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
    metatype: AuthGoogleLoginDto,
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
  return { error, status: error.getStatus(), messages: Array.isArray(raw) ? raw : [raw] };
}

/** Invokes the service ONCE and returns whatever it threw (defect T3). */
async function captureRejection(promise: Promise<unknown>) {
  let caught: unknown;
  let resolved = false;
  await promise.then(
    () => {
      resolved = true;
    },
    (error: unknown) => {
      caught = error;
    },
  );
  if (resolved) {
    throw new Error('expected validateLogin to reject, but it resolved');
  }
  return caught;
}

const TOKEN = 'token-01';

const GOOGLE_PAYLOAD = {
  sub: 'google-sub-0001',
  email: 'nguyen.a@example.com',
  given_name: 'A',
  family_name: 'Nguyen',
};

function createService(verifyIdToken: jest.Mock) {
  const configService = { get: jest.fn() };
  const service = new AuthGoogleService(configService as any);
  // The constructor builds a real OAuth2Client (no network on construction); swap it for a
  // stub so no request ever leaves the process.
  (service as any).client = { verifyIdToken };
  return service;
}

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

describe('Login with Google — AuthGoogleService.validateLogin()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is wired and firing. If this fails, the negative assertion
    // below is meaningless.
    it('canary — a valid AuthGoogleLoginDto passes the real ValidationPipe', async () => {
      await expect(runPipe({ token: TOKEN })).resolves.toEqual(
        expect.objectContaining({ token: TOKEN }),
      );
    });

    it('UTCID02 — an empty token is rejected as 400 with "token should not be empty" [MATCHES]', async () => {
      const { status, messages } = await capturePipeRejection({ token: '' });

      expect(status).toBe(400);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toContain('token should not be empty');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — a valid id-token returns the SocialInterface built from the Google payload [MATCHES]', async () => {
      const verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => GOOGLE_PAYLOAD,
      });
      const service = createService(verifyIdToken);
      global.fetch = jest.fn() as any;

      const result = await service.validateLogin({ token: TOKEN } as AuthGoogleLoginDto);

      expect(result).toEqual({
        id: GOOGLE_PAYLOAD.sub,
        email: GOOGLE_PAYLOAD.email,
        firstName: GOOGLE_PAYLOAD.given_name,
        lastName: GOOGLE_PAYLOAD.family_name,
      });
      // The id-token path succeeded, so the access-token fallback was never reached.
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('UTCID03 — a payload-less id-token does NOT surface Error("Invalid Google token"); it falls through and ends as UnauthorizedException [DIVERGES: SPEC_WRONG — that Error is swallowed by the bare catch at auth-google.service.ts:41]', async () => {
      const verifyIdToken = jest.fn().mockResolvedValue({ getPayload: () => null });
      const service = createService(verifyIdToken);
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

      const caught = await captureRejection(
        service.validateLogin({ token: TOKEN } as AuthGoogleLoginDto),
      );

      // Not a raw Error — the fallback ran and its own catch converted the failure.
      expect(caught).toBeInstanceOf(UnauthorizedException);
      expect((caught as UnauthorizedException).message).toBe('Invalid Google token');
      // Proves the fallback was actually entered, which is what makes the sheet's Error unreachable.
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('UTCID04 — a failing userinfo request does NOT surface Error("Invalid Google access token"); it is converted to UnauthorizedException [DIVERGES: SPEC_WRONG — that Error is swallowed by the bare catch at auth-google.service.ts:67]', async () => {
      const verifyIdToken = jest.fn().mockRejectedValue(new Error('bad id token'));
      const service = createService(verifyIdToken);
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

      const caught = await captureRejection(
        service.validateLogin({ token: TOKEN } as AuthGoogleLoginDto),
      );

      expect(caught).toBeInstanceOf(UnauthorizedException);
      // Note the wording: NOT the 'Invalid Google access token' the sheet expects.
      expect((caught as UnauthorizedException).message).toBe('Invalid Google token');
    });

    it('UTCID05 — when both strategies fail the caller sees UnauthorizedException("Invalid Google token") [MATCHES]', async () => {
      const verifyIdToken = jest.fn().mockRejectedValue(new Error('bad id token'));
      const service = createService(verifyIdToken);
      global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;

      const caught = await captureRejection(
        service.validateLogin({ token: TOKEN } as AuthGoogleLoginDto),
      );

      expect(caught).toBeInstanceOf(UnauthorizedException);
      expect((caught as UnauthorizedException).message).toBe('Invalid Google token');
    });
  });
});
