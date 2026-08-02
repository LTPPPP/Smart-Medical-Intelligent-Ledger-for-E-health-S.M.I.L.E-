import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import {
  GenderEnum,
  GENDER_VALUES,
  RoleEnum,
} from '@auth/accounts/domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

export class QueryUserProfileDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

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
  gender?: number;

  @ApiProperty({ required: false, enum: RoleEnum, example: RoleEnum.PATIENT })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}

