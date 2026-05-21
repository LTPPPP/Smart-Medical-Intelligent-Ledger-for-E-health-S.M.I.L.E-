import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { OtpTokensRepository } from './infrastructure/persistence/repositories/otp-token.repository';
import { OtpToken, OtpType } from './domain/otp-token';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class OtpTokensService {
  constructor(
    private readonly otpTokensRepository: OtpTokensRepository,
    private readonly configService: ConfigService<any>,
  ) {}

  async findById(id: string): Promise<NullableType<OtpToken>> {
    return this.otpTokensRepository.findById(id);
  }

  async findValidByAccountAndCode(
    accountId: string,
    otpCode: string,
    otpType: OtpType,
  ): Promise<NullableType<OtpToken>> {
    return this.otpTokensRepository.findValidByAccountAndCode(
      accountId,
      otpCode,
      otpType,
    );
  }

  async create(
    accountId: string,
    otpType: OtpType,
  ): Promise<OtpToken> {
    const otpCode = this.generateOtpCode();
    const expiresIn = process.env.AUTH_OTP_EXPIRES as any;
    const expiresAt = new Date(Date.now() + ms(expiresIn));

    return this.otpTokensRepository.create({
      accountId,
      otpCode,
      otpType,
      expiresAt,
    });
  }

  async markAsUsed(id: string): Promise<void> {
    return this.otpTokensRepository.markAsUsed(id);
  }

  async deleteExpired(): Promise<void> {
    return this.otpTokensRepository.deleteExpired();
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
