import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender, GENDER_VALUES } from '../../utils/enums/gender.enum';
import { genderCodeTransformer } from '../../utils/transformers/gender-code.transformer';

// Self Service Subset
export class CreateMyPatientDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  full_name: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    enum: GENDER_VALUES,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @IsOptional()
  @Transform(genderCodeTransformer)
  @IsInt()
  @IsIn(GENDER_VALUES)
  gender?: number;

  @ApiProperty({ example: '+84901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
