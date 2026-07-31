import { createHmac } from 'node:crypto';
import { extractActorFromAuthorization } from './actor.util';

// Conformance vectors. The same table is asserted against payment-service's
// actor.util.ts and gateway-service's extractTrustedActorFromAuthorization so
// the three hand-written verifiers cannot drift apart (backlog N-05/C-14).

const SECRET = 'conformance-secret';
const now = () => Math.floor(Date.now() / 1000);

function sign(
  payload: Record<string, unknown>,
  options: { alg?: string; secret?: string } = {},
): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const signingInput = `${encode({ alg: options.alg ?? 'HS256', typ: 'JWT' })}.${encode(payload)}`;
  const signature = createHmac('sha256', options.secret ?? SECRET)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

const accepted: [string, string][] = [
  ['a valid token', sign({ accountId: 'account-1', exp: now() + 60 })],
  [
    'a token whose nbf is within the allowed clock skew',
    sign({ accountId: 'account-1', exp: now() + 60, nbf: now() + 30 }),
  ],
];

const rejected: [string, string | undefined][] = [
  ['no authorization header', undefined],
  ['a non-bearer scheme', `Basic ${sign({ accountId: 'a', exp: now() + 60 })}`],
  ['a malformed token', 'Bearer not.a.jwt.at.all'],
  ['a token with no exp claim', `Bearer ${sign({ accountId: 'account-1' })}`],
  [
    'a token with a non-numeric exp',
    `Bearer ${sign({ accountId: 'account-1', exp: 'later' })}`,
  ],
  [
    'an expired token',
    `Bearer ${sign({ accountId: 'account-1', exp: now() - 1 })}`,
  ],
  [
    'a token not yet valid beyond the clock skew',
    `Bearer ${sign({ accountId: 'account-1', exp: now() + 600, nbf: now() + 3600 })}`,
  ],
  [
    'a token with no accountId',
    `Bearer ${sign({ role: 'ADMIN', exp: now() + 60 })}`,
  ],
  [
    'a token signed with another secret',
    `Bearer ${sign({ accountId: 'account-1', exp: now() + 60 }, { secret: 'other' })}`,
  ],
  [
    'an alg=none token',
    `Bearer ${sign({ accountId: 'account-1', exp: now() + 60 }, { alg: 'none' })}`,
  ],
  [
    'an RS256-claiming token',
    `Bearer ${sign({ accountId: 'account-1', exp: now() + 60 }, { alg: 'RS256' })}`,
  ],
  [
    'a tampered payload',
    `Bearer ${sign({ accountId: 'account-1', exp: now() + 60 }).replace(/\.[^.]+$/, '.deadbeef')}`,
  ],
];

describe('extractActorFromAuthorization', () => {
  it.each(accepted)('accepts %s', (_label, token) => {
    expect(extractActorFromAuthorization(`Bearer ${token}`, SECRET)).toEqual({
      accountId: 'account-1',
      role: undefined,
    });
  });

  it.each(rejected)('rejects %s', (_label, authorization) => {
    expect(extractActorFromAuthorization(authorization, SECRET)).toBeNull();
  });

  it('should reject every token when no secret is configured', () => {
    const token = `Bearer ${sign({ accountId: 'account-1', exp: now() + 60 })}`;

    expect(extractActorFromAuthorization(token, undefined)).toBeNull();
  });

  it('should carry the role claim through when present', () => {
    const token = `Bearer ${sign({ accountId: 'account-1', role: 'DOCTOR', exp: now() + 60 })}`;

    expect(extractActorFromAuthorization(token, SECRET)).toEqual({
      accountId: 'account-1',
      role: 'DOCTOR',
    });
  });
});
