import { createHmac, timingSafeEqual } from 'node:crypto';

const CLOCK_SKEW_SECONDS = 60;

export interface Actor {
  accountId: string;
  role?: string;
}

// Verify Actor Token
export function extractActorFromAuthorization(
  authorization: string | undefined,
  secret: string | undefined,
): Actor | null {
  if (!authorization || !secret) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  try {
    const header = JSON.parse(
      Buffer.from(encodedHeader, 'base64url').toString('utf8'),
    ) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as {
      accountId?: unknown;
      role?: unknown;
      exp?: unknown;
      nbf?: unknown;
    };
    const now = Math.floor(Date.now() / 1000);
    // `exp` is mandatory — a token issued without it would never expire, and
    // this service has no revocation channel of its own.
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      return null;
    }
    if (
      typeof payload.nbf === 'number' &&
      payload.nbf > now + CLOCK_SKEW_SECONDS
    ) {
      return null;
    }
    if (typeof payload.accountId !== 'string' || !payload.accountId) {
      return null;
    }
    return {
      accountId: payload.accountId,
      role:
        typeof payload.role === 'string' && payload.role
          ? payload.role
          : undefined,
    };
  } catch {
    return null;
  }
}
