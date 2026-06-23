import { createHmac } from 'node:crypto';

const mockProxy = jest.fn();

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => mockProxy),
  fixRequestBody: jest.fn(),
}));

import {
  extractTrustedPatientIdFromAuthorization,
  ProxyMiddlewareFactory,
} from './proxy.middleware';

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

describe('ProxyMiddlewareFactory', () => {
  const route = {
    prefix: '/api/v1/appointments',
    target: 'http://clinical-emr-service:8082',
    pathRewrite: {},
    serviceName: 'clinical-emr-service',
  };

  beforeEach(() => {
    mockProxy.mockClear();
    process.env.AUTH_JWT_SECRET = 'secret';
  });

  it('rejects unauthenticated clinical appointment requests before proxying', () => {
    const middleware = new ProxyMiddlewareFactory().createMiddleware(route, 30000);
    const req = {
      method: 'GET',
      url: '/api/v1/appointments/patient/patient-1',
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    middleware(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      }),
    );
    expect(mockProxy).not.toHaveBeenCalled();
  });

  it('injects trusted identity headers before proxying authenticated clinical appointment requests', () => {
    const token = signJwt({ accountId: 'account-1', exp: Math.floor(Date.now() / 1000) + 60 }, 'secret');
    const middleware = new ProxyMiddlewareFactory().createMiddleware(route, 30000);
    const req = {
      method: 'GET',
      url: '/api/v1/appointments/patient/patient-1',
      headers: {
        authorization: `Bearer ${token}`,
      } as Record<string, string>,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    middleware(req as any, res as any, next);

    expect(req.headers['x-auth-user-id']).toBe('account-1');
    expect(req.headers['x-patient-id']).toBe('account-1');
    expect(mockProxy).toHaveBeenCalledWith(req, res, next);
  });
});
