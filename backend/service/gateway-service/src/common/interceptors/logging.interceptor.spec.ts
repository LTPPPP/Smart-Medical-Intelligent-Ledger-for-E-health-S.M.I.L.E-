import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { sanitizeLogPath } from '../sanitize-log-path';

describe('sanitizeLogPath', () => {
  it.each([
    [
      '/api/v1/auth/reset/abcdefgh.ijklmnop.qrstuvwx?token=SENTINEL_QUERY',
      '/api/v1/auth/reset/:id',
    ],
    [
      '/api/v1/accounts/private.user%40example.test',
      '/api/v1/accounts/:id',
    ],
    ['/api/v1/health\r\nSENTINEL_CONTROL', '/api/v1/healthSENTINEL_CONTROL'],
  ])('sanitizes sensitive and control path segments', (input, expected) => {
    const output = sanitizeLogPath(input);

    expect(output).toBe(expected);
    expect(output).not.toMatch(/[\r\n\t?]/);
    expect(output).not.toContain('SENTINEL_QUERY');
  });
});

describe('LoggingInterceptor', () => {
  it('logs the pathname and correlation ID without query or secure data', async () => {
    const interceptor = new LoggingInterceptor();
    const log = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation();
    const request = {
      method: 'GET',
      originalUrl:
        '/api/v1/appointments/APT-20260729-SENTINEL/payments/987654?vnp_SecureHash=SENTINEL_VNP_SECRET&token=SENTINEL_TOKEN',
      headers: {
        'x-correlation-id': 'correlation-123',
      },
    };
    const response = { statusCode: 200 };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    await lastValueFrom(
      interceptor.intercept(context as any, { handle: () => of({}) }),
    );

    const output = log.mock.calls.flat().join(' ');
    expect(output).toContain('method=GET');
    expect(output).toContain(
      'path=/api/v1/appointments/:id/payments/:id',
    );
    expect(output).toContain('status=200');
    expect(output).toContain('durationMs=');
    expect(output).toContain('correlationId=correlation-123');
    expect(output).not.toContain('SENTINEL_VNP_SECRET');
    expect(output).not.toContain('SENTINEL_TOKEN');
    expect(output).not.toContain('APT-20260729-SENTINEL');
    expect(output).not.toContain('987654');
    expect(output).not.toContain('?');
  });
});
