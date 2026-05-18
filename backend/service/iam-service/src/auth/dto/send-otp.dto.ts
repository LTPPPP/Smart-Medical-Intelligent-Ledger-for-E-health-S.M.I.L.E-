import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: 'admin@smile.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: ['login', 'password_reset', 'identity_verify'] })
  @IsString()
  @IsNotEmpty()
  type: string;
}
