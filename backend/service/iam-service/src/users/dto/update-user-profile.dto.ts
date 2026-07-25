import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsIn,
  IsInt,
  MaxLength,
} from 'class-validator';

import { GenderEnum, GENDER_VALUES } from '@auth/accounts/domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

export class UpdateUserProfileDto {
  @ApiProperty({ required: false, example: 'Nguyen Van B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiProperty({ required: false, example: 'user@smile.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ required: false, example: '+84901234567' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string | null;

  @ApiProperty({
    required: false,
    enum: GENDER_VALUES,
    example: GenderEnum.FEMALE,
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
