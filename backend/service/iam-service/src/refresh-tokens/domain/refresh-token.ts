import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshToken {
  @ApiProperty({ type: String })
  @Expose()
  tokenId: string;

  @ApiProperty({ type: String })
  @Expose()
  accountId: string | null;

  @Expose({ toPlainOnly: true })
  tokenHash: string;

  @ApiProperty({ type: Date })
  @Expose()
  expiresAt: Date;

  @ApiProperty({ type: Date })
  @Expose()
  revokedAt: Date | null;

  @ApiProperty({ type: String })
  @Expose()
  deviceInfo: string | null;

  @ApiProperty({ type: String })
  @Expose()
  ipAddress: string | null;

  @ApiProperty({ type: Date })
  @Expose()
  createdAt: Date;
}
