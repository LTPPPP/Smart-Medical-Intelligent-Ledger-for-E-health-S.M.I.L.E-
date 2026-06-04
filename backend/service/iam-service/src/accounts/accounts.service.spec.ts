import { UnauthorizedException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { OtpType } from '../otp-tokens/domain/otp-token';

describe('AccountsService phone verification', () => {
  const createService = () => {
    const accountsRepository = {
      update: jest.fn(async () => null),
    };
    const otpTokensService = {
      create: jest.fn(),
      findValidByAccountAndCode: jest.fn(),
      markAsUsed: jest.fn(async () => undefined),
    };
    const service = new AccountsService(accountsRepository as any, otpTokensService as any);
    return { service, accountsRepository, otpTokensService };
  };

  it('marks phone verified and consumes the identity OTP', async () => {
    const { service, accountsRepository, otpTokensService } = createService();
    otpTokensService.findValidByAccountAndCode.mockResolvedValue({
      otpId: 'otp-id',
      otpType: OtpType.IDENTITY_VERIFY,
    });

    await service.verifyPhoneWithOtp('account-id', '123456');

    expect(otpTokensService.findValidByAccountAndCode).toHaveBeenCalledWith(
      'account-id',
      '123456',
      OtpType.IDENTITY_VERIFY,
    );
    expect(otpTokensService.markAsUsed).toHaveBeenCalledWith('otp-id');
    expect(accountsRepository.update).toHaveBeenCalledWith('account-id', {
      phoneVerified: true,
    });
  });

  it('creates an identity verification OTP for phone verification', async () => {
    const { service, otpTokensService } = createService();
    otpTokensService.create.mockResolvedValue({
      otpId: 'otp-id',
      otpCode: '123456',
      expiresAt: new Date('2026-06-01T10:00:00.000Z'),
    });

    const result = await service.createPhoneVerificationOtp('account-id');

    expect(otpTokensService.create).toHaveBeenCalledWith(
      'account-id',
      OtpType.IDENTITY_VERIFY,
    );
    expect(result.devOtp).toBe('123456');
  });

  it('rejects invalid phone verification OTP', async () => {
    const { service, accountsRepository, otpTokensService } = createService();
    otpTokensService.findValidByAccountAndCode.mockResolvedValue(null);

    await expect(service.verifyPhoneWithOtp('account-id', '000000')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(accountsRepository.update).not.toHaveBeenCalled();
  });
});
