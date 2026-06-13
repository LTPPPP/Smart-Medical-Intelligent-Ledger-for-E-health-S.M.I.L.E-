import { ConflictException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';

import { IdempotencyInterceptor } from './idempotency.interceptor';

function createContext(headers: Record<string, string> = {}) {
  const response = {
    status: jest.fn().mockReturnThis(),
    statusCode: 201,
  };
  const request = {
    headers,
    method: 'POST',
    originalUrl: '/api/v1/appointments',
    url: '/api/v1/appointments',
  };

  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any,
    response,
  };
}

function createRepo() {
  return {
    findOne: jest.fn(),
    insert: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };
}

describe('IdempotencyInterceptor', () => {
  it('should pass through requests without an idempotency key', async () => {
    const repo = createRepo();
    const interceptor = new IdempotencyInterceptor(repo as any);
    const { context } = createContext();
    const next = { handle: jest.fn(() => of({ created: true })) };

    await expect(
      lastValueFrom(await interceptor.intercept(context, next)),
    ).resolves.toEqual({ created: true });

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalled();
  });

  it('should replay a completed response for the same idempotency key', async () => {
    const repo = createRepo();
    repo.findOne.mockResolvedValue({
      idempotency_key: 'idem-1',
      status: 'completed',
      response_status: 201,
      response_body: { appointment_id: 'apt-1' },
      expires_at: new Date(Date.now() + 60_000),
    });
    const interceptor = new IdempotencyInterceptor(repo as any);
    const { context, response } = createContext({
      'idempotency-key': 'idem-1',
    });
    const next = { handle: jest.fn(() => of({ created: true })) };

    await expect(
      lastValueFrom(await interceptor.intercept(context, next)),
    ).resolves.toEqual({ appointment_id: 'apt-1' });

    expect(response.status).toHaveBeenCalledWith(201);
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('should reject a request while the same key is in progress', async () => {
    const repo = createRepo();
    repo.findOne.mockResolvedValue({
      status: 'in_progress',
      expires_at: new Date(Date.now() + 60_000),
    });
    const interceptor = new IdempotencyInterceptor(repo as any);
    const { context } = createContext({ 'idempotency-key': 'idem-1' });

    await expect(
      interceptor.intercept(context, { handle: jest.fn() }),
    ).rejects.toThrow(ConflictException);
  });

  it('should store successful responses and release failed requests', async () => {
    const repo = createRepo();
    repo.findOne.mockResolvedValue(null);
    const interceptor = new IdempotencyInterceptor(repo as any);
    const { context } = createContext({ 'idempotency-key': 'idem-1' });

    await expect(
      lastValueFrom(
        await interceptor.intercept(context, {
          handle: jest.fn(() => of({ appointment_id: 'apt-1' })),
        }),
      ),
    ).resolves.toEqual({ appointment_id: 'apt-1' });

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: 'idem-1',
        status: 'in_progress',
      }),
    );
    expect(repo.update).toHaveBeenCalledWith(
      { idempotency_key: 'idem-1' },
      expect.objectContaining({
        status: 'completed',
        response_status: 201,
        response_body: { appointment_id: 'apt-1' },
      }),
    );

    repo.findOne.mockResolvedValueOnce(null);
    await expect(
      lastValueFrom(
        await interceptor.intercept(context, {
          handle: jest.fn(() => throwError(() => new Error('boom'))),
        }),
      ),
    ).rejects.toThrow('boom');

    expect(repo.delete).toHaveBeenCalledWith({ idempotency_key: 'idem-1' });
  });
});
