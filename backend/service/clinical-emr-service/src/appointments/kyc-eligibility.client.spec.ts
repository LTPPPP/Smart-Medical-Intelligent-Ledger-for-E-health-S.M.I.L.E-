import { ForbiddenException } from '@nestjs/common';
import { KycEligibilityClient } from './kyc-eligibility.client';

describe('KycEligibilityClient', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.BOOKING_KYC_ENABLED;
    delete process.env.BOOKING_SKIP_KYC;
    delete process.env.IAM_INTERNAL_API_KEY;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should bypass KYC by default while the feature is paused', async () => {
    const client = new KycEligibilityClient();

    await expect(client.assertCanBook('user-1')).resolves.toBeUndefined();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should enforce KYC when explicitly enabled', async () => {
    process.env.BOOKING_KYC_ENABLED = 'true';
    process.env.IAM_INTERNAL_API_KEY = 'configured-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        userId: 'user-1',
        phoneVerified: true,
        kycStatus: 'rejected',
        canBook: false,
      }),
    });
    const client = new KycEligibilityClient();

    await expect(client.assertCanBook('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/kyc/users/user-1/status',
      {
        headers: {
          'x-internal-api-key': 'configured-key',
        },
      },
    );
  });

  it('should let the demo skip flag override an enabled KYC gate', async () => {
    process.env.BOOKING_KYC_ENABLED = 'true';
    process.env.BOOKING_SKIP_KYC = 'true';
    const client = new KycEligibilityClient();

    await expect(client.assertCanBook('user-1')).resolves.toBeUndefined();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
