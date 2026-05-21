import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GenderEnum, RoleEnum } from '../domain/account';

export class CreateAccountDto {
  @ApiProperty({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ enum: GenderEnum, example: GenderEnum.MALE, required: false })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.PATIENT, required: false })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}

