import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GenderEnum, GENDER_VALUES, RoleEnum } from '../domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

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

  @ApiProperty({
    enum: GENDER_VALUES,
    example: GenderEnum.MALE,
    required: false,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @IsOptional()
  @Transform(genderCodeTransformer)
  @IsInt()
  @IsIn(GENDER_VALUES)
  gender?: GenderEnum;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.PATIENT, required: false })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}

