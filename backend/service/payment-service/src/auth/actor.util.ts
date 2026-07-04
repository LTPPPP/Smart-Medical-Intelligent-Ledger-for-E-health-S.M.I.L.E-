import { createHmac, timingSafeEqual } from 'node:crypto';

export interface Actor {
  accountId: string;
  role?: string;
}

/**
 * Verify an HS256 JWT (same scheme the gateway issues/validates) using the
 * shared AUTH_JWT_SECRET and return the trusted actor. Returns null for any
 * missing/malformed/expired/invalid token.
 *
 * Payment-service is not behind a hardening layer that strips client-supplied
 * `x-auth-*` headers, so it must not trust those headers — it re-verifies the
 * bearer token itself.
 */
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
    ) as { accountId?: unknown; role?: unknown; exp?: unknown };
    if (
      typeof payload.exp === 'number' &&
      payload.exp <= Math.floor(Date.now() / 1000)
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
