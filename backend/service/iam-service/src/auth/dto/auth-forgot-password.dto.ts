import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'admin@smile.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
