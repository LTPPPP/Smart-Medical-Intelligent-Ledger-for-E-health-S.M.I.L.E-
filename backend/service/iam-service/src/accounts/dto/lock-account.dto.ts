import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockAccountDto {
  @ApiProperty({ example: 'Suspicious activity detected' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
