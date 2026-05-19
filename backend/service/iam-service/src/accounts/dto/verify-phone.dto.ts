import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}
