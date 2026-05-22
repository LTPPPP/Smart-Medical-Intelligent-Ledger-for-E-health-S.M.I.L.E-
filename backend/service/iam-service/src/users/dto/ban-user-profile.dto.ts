import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanUserProfileDto {
  @ApiProperty({ required: false, example: 'Violated terms of service' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
