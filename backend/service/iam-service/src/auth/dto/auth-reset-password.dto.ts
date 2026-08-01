import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';

export class AuthResetPasswordDto {
  // Legacy hash flow
  @ApiProperty({ required: false, description: 'JWT hash from a reset-password email link' })
  @ValidateIf((dto: AuthResetPasswordDto) => !dto.otp)
  @IsString()
  @IsNotEmpty()
  hash?: string;

  @ApiProperty({ required: false })
  @ValidateIf((dto: AuthResetPasswordDto) => !!dto.hash)
  @IsString()
  @MinLength(8)
  password?: string;

  // OTP flow
  @ApiProperty({ required: false, example: 'admin@smile.com' })
  @ValidateIf((dto: AuthResetPasswordDto) => !dto.hash)
  @IsString()
  @IsNotEmpty()
  emailOrPhone?: string;

  @ApiProperty({ required: false, example: '123456' })
  @ValidateIf((dto: AuthResetPasswordDto) => !dto.hash)
  @IsString()
  @IsNotEmpty()
  otp?: string;

  @ApiProperty({ required: false })
  @ValidateIf((dto: AuthResetPasswordDto) => !dto.hash)
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
