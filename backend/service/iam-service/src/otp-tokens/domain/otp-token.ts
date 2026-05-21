import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OtpType {
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
  IDENTITY_VERIFY = 'identity_verify',
}

export class OtpToken {
  @ApiProperty({ type: String })
  @Expose()
  otpId: string;

  @ApiProperty({ type: String })
  @Expose()
  accountId: string | null;

  @Expose({ toPlainOnly: true })
  otpCode: string;

  @ApiProperty({ enum: OtpType })
  @Expose()
  otpType: OtpType;

  @ApiProperty({ type: Date })
  @Expose()
  expiresAt: Date;

  @ApiProperty({ type: Date })
  @Expose()
  usedAt: Date | null;

  @ApiProperty({ type: Date })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updatedAt: Date;
}
