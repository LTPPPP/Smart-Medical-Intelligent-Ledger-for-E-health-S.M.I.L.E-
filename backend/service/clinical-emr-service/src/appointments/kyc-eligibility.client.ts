import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

interface KycEligibilityResponse {
  userId: string;
  phoneVerified: boolean;
  kycStatus: string;
  canBook: boolean;
}

@Injectable()
export class KycEligibilityClient {
  private readonly iamServiceUrl = (
    process.env.IAM_SERVICE_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');
  // No fallback — iam-service rejects an unset/incorrect key outright, so a
  // misconfigured deployment must fail the eligibility check, not guess.
  private readonly internalApiKey = process.env.IAM_INTERNAL_API_KEY ?? '';

  async assertCanBook(userId: string): Promise<void> {
    if (process.env.BOOKING_SKIP_KYC === 'true') {
      return;
    }
    if (process.env.BOOKING_KYC_ENABLED !== 'true') {
      return;
    }

    if (!userId) {
      throw new ForbiddenException({
        code: 'KYC_REQUIRED',
        message: 'User id is required for KYC booking check',
      });
    }

    let response: Response;
    try {
      response = await fetch(
        `${this.iamServiceUrl}/v1/kyc/users/${userId}/status`,
        {
          headers: {
            'x-internal-api-key': this.internalApiKey,
          },
        },
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'KYC_CHECK_UNAVAILABLE',
        message: 'Unable to verify KYC status before booking',
      });
    }

    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'KYC_CHECK_UNAVAILABLE',
        message: 'Unable to verify KYC status before booking',
      });
    }

    const eligibility = (await response.json()) as KycEligibilityResponse;
    if (!eligibility.canBook) {
      throw new ForbiddenException({
        code: 'KYC_REQUIRED',
        message:
          'Phone verification and approved KYC are required before booking',
        phoneVerified: eligibility.phoneVerified,
        kycStatus: eligibility.kycStatus,
      });
    }
  }
}
