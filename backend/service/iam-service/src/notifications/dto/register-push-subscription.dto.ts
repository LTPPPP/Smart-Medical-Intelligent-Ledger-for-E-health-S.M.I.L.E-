import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, IsUrl, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionKeysDto {
  @ApiProperty({ description: 'Client public key (P-256 ECDH)' })
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @ApiProperty({ description: 'Client auth secret' })
  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class RegisterPushSubscriptionDto {
  @ApiProperty({ description: 'Push service endpoint URL' })
  @IsUrl({ require_tld: false })
  endpoint: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class UnregisterPushSubscriptionDto {
  @ApiProperty({ description: 'Push service endpoint URL to remove' })
  @IsUrl({ require_tld: false })
  endpoint: string;
}
