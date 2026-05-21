import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthConnection {
  @ApiProperty({ type: String })
  @Expose()
  connectionId: string;

  @ApiProperty({ type: String })
  @Expose()
  accountId: string | null;

  @ApiProperty({ enum: ['google', 'facebook', 'apple'] })
  @Expose()
  provider: string;

  @ApiProperty({ type: String })
  @Expose()
  providerUserId: string;

  @Expose({ toPlainOnly: true })
  accessToken?: string;

  @Expose({ toPlainOnly: true })
  refreshToken?: string;

  @ApiProperty({ type: Date })
  @Expose()
  tokenExpiresAt: Date | null;

  @ApiProperty({ type: Boolean })
  @Expose()
  isActive: boolean;

  @ApiProperty({ type: Date })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updatedAt: Date;
}
