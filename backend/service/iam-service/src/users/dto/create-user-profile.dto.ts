import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  IsInt,
  MaxLength,
} from 'class-validator';

import { GenderEnum, GENDER_VALUES } from '@auth/accounts/domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

export class CreateUserProfileDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  full_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date_of_birth?: string | null;

  @ApiProperty({
    required: false,
    enum: GENDER_VALUES,
    example: GenderEnum.MALE,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @IsOptional()
  @Transform(genderCodeTransformer)
  @IsInt()
  @IsIn(GENDER_VALUES)
  gender?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string | null;
}
