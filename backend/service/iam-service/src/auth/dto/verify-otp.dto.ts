import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
