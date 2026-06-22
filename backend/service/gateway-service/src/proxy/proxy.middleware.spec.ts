import { createHmac } from 'node:crypto';

import { extractTrustedPatientIdFromAuthorization } from './proxy.middleware';

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

describe('extractTrustedPatientIdFromAuthorization', () => {
  it('extracts accountId from a valid bearer token', () => {
    const token = signJwt({ accountId: 'patient-1', exp: Math.floor(Date.now() / 1000) + 60 }, 'secret');

    expect(extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret')).toBe('patient-1');
  });

  it('rejects forged tokens signed with another secret', () => {
    const token = signJwt({ accountId: 'attacker' }, 'wrong-secret');

    expect(extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret')).toBeNull();
  });

  it('rejects expired tokens', () => {
    const token = signJwt({ accountId: 'patient-1', exp: Math.floor(Date.now() / 1000) - 1 }, 'secret');

    expect(extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret')).toBeNull();
  });
});
