import { createHmac } from 'node:crypto';

const mockProxy = jest.fn();
let capturedProxyOptions: any;

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn((options) => {
    capturedProxyOptions = options;
    return mockProxy;
  }),
  fixRequestBody: jest.fn(),
}));

import {
  extractTrustedPatientIdFromAuthorization,
  ProxyMiddlewareFactory,
} from './proxy.middleware';

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

describe('extractTrustedPatientIdFromAuthorization', () => {
  it('extracts accountId from a valid bearer token', () => {
    const token = signJwt(
      { accountId: 'patient-1', exp: Math.floor(Date.now() / 1000) + 60 },
      'secret',
    );

    expect(
      extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret'),
    ).toBe('patient-1');
  });

  it('rejects forged tokens signed with another secret', () => {
    const token = signJwt({ accountId: 'attacker' }, 'wrong-secret');

    expect(
      extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret'),
    ).toBeNull();
  });

  it('rejects expired tokens', () => {
    const token = signJwt(
      { accountId: 'patient-1', exp: Math.floor(Date.now() / 1000) - 1 },
      'secret',
    );

    expect(
      extractTrustedPatientIdFromAuthorization(`Bearer ${token}`, 'secret'),
    ).toBeNull();
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
    capturedProxyOptions = undefined;
    process.env.AUTH_JWT_SECRET = 'secret';
  });

  it('rejects unauthenticated clinical appointment requests before proxying', () => {
    const middleware = new ProxyMiddlewareFactory().createMiddleware(
      route,
      30000,
    );
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

  it('injects trusted identity and role headers before proxying authenticated clinical appointment requests', () => {
    const token = signJwt(
      {
        accountId: 'account-1',
        role: 'DOCTOR',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      'secret',
    );
    const middleware = new ProxyMiddlewareFactory().createMiddleware(
      route,
      30000,
    );
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
    expect(req.headers['x-auth-role']).toBe('DOCTOR');
    expect(req.headers['x-patient-id']).toBe('account-1');
    expect(mockProxy).toHaveBeenCalledWith(req, res, next);
  });

  it('requires trusted identity for patient representative routes', () => {
    const middleware = new ProxyMiddlewareFactory().createMiddleware(
      {
        prefix: '/api/v1/patient-representatives',
        target: 'http://clinical-emr-service:8082',
        pathRewrite: { '^/api/v1': '/api' },
        serviceName: 'clinical-emr-service',
      },
      30000,
    );
    const req = {
      method: 'GET',
      url: '/api/v1/patient-representatives/patient/patient-1',
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    middleware(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockProxy).not.toHaveBeenCalled();
  });

  it('sets trusted identity headers on the outgoing proxied request', () => {
    const token = signJwt(
      {
        accountId: 'account-1',
        role: 'PATIENT',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      'secret',
    );
    const middleware = new ProxyMiddlewareFactory().createMiddleware(
      {
        prefix: '/api/v1/ai/booking-chat',
        target: 'http://booking-langgraph-service:8030',
        pathRewrite: { '^/api/v1/ai/booking-chat': '' },
        serviceName: 'booking-langgraph-service',
      },
      30000,
    );
    const req = {
      method: 'POST',
      url: '/api/v1/ai/booking-chat/chat',
      headers: {
        authorization: `Bearer ${token}`,
      } as Record<string, string>,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const proxyReq = {
      setHeader: jest.fn(),
    };

    middleware(req as any, res as any, jest.fn());
    capturedProxyOptions.on.proxyReq(proxyReq, req);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('x-auth-user-id', 'account-1');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('x-patient-id', 'account-1');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('x-auth-role', 'PATIENT');
  });

  it('strips client-supplied identity headers on routes that do not require trusted identity', () => {
    const middleware = new ProxyMiddlewareFactory().createMiddleware(
      {
        prefix: '/api/v1/clinics',
        target: 'http://clinical-emr-service:8082',
        pathRewrite: {},
        serviceName: 'clinical-emr-service',
      },
      30000,
    );
    const req = {
      method: 'GET',
      url: '/api/v1/clinics',
      headers: {
        'x-auth-user-id': 'attacker-controlled',
        'x-auth-role': 'ADMIN',
        'x-patient-id': 'attacker-controlled',
      } as Record<string, string>,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    middleware(req as any, res as any, next);

    expect(req.headers['x-auth-user-id']).toBeUndefined();
    expect(req.headers['x-auth-role']).toBeUndefined();
    expect(req.headers['x-patient-id']).toBeUndefined();
    expect(mockProxy).toHaveBeenCalledWith(req, res, next);
  });

  it('logs only sanitized proxy metadata without query or VNPay secure data', () => {
    const factory = new ProxyMiddlewareFactory();
    const debug = jest
      .spyOn((factory as any).logger, 'debug')
      .mockImplementation();
    factory.createMiddleware(
      {
        prefix: '/api/v1/payments/vnpay-return',
        target: 'http://payment-service:3006',
        pathRewrite: {},
        serviceName: 'payment-service',
      },
      30000,
    );
    const req = {
      method: 'GET',
      url: '/api/v1/accounts/account-SENTINEL-42/payments/PAY-20260729-SENTINEL?vnp_SecureHash=SENTINEL_VNP_SECRET&token=SENTINEL_TOKEN',
      headers: {
        'x-correlation-id': 'correlation-123',
      },
    };
    const proxyReq = {
      setHeader: jest.fn(),
    };

    capturedProxyOptions.on.proxyReq(proxyReq, req);
    capturedProxyOptions.on.proxyRes({ statusCode: 200, headers: {} }, req);

    const output = debug.mock.calls.flat().join(' ');
    expect(output).toContain('method=GET');
    expect(output).toContain('path=/api/v1/accounts/:id/payments/:id');
    expect(output).toContain('service=payment-service');
    expect(output).toContain('status=200');
    expect(output).toContain('correlationId=correlation-123');
    expect(output).not.toContain('SENTINEL_VNP_SECRET');
    expect(output).not.toContain('SENTINEL_TOKEN');
    expect(output).not.toContain('account-SENTINEL-42');
    expect(output).not.toContain('PAY-20260729-SENTINEL');
    expect(output).not.toContain('?');
  });

  it('does not include raw proxy error details in 502 logs', () => {
    const factory = new ProxyMiddlewareFactory();
    const error = jest
      .spyOn((factory as any).logger, 'error')
      .mockImplementation();
    factory.createMiddleware(
      {
        prefix: '/api/v1/payments',
        target: 'http://payment-service:3006',
        pathRewrite: {},
        serviceName: 'payment-service',
      },
      30000,
    );
    const req = {
      method: 'POST',
      url: '/api/v1/payments?token=SENTINEL_TOKEN',
      headers: {
        'x-correlation-id': 'correlation-500',
      },
    };
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    capturedProxyOptions.on.error(
      new Error('SENTINEL_RAW_PROXY_ERROR'),
      req,
      res,
    );

    const output = error.mock.calls.flat().join(' ');
    expect(output).toContain('status=502');
    expect(output).toContain('path=/api/v1/payments');
    expect(output).toContain('correlationId=correlation-500');
    expect(output).not.toContain('SENTINEL_RAW_PROXY_ERROR');
    expect(output).not.toContain('SENTINEL_TOKEN');
  });
});
