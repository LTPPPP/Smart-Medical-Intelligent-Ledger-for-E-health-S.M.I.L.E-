import {
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GENDER_VALUES } from '../../utils/enums/gender.enum';
import { BLOOD_TYPES } from '../../utils/enums/blood-type.enum';

/** Uppercase + trim so casing variations ('male') normalize to canonical ('MALE'). */
const toUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreatePatientDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440004',
    description:
      'Linked IAM/user profile ID, if the patient already has an account.',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    example: 'PAT-001',
    description: 'Unique patient code used for lookup and clinic operations.',
  })
  @IsString()
  patient_code: string;

  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Patient full name.',
  })
  @IsString()
  full_name: string;

  @ApiPropertyOptional({
    example: '1995-06-15',
    description: 'Patient date of birth in ISO date format.',
  })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    description: 'Patient gender.',
    enum: GENDER_VALUES,
  })
  @IsOptional()
  @Transform(toUpper)
  @IsIn(GENDER_VALUES)
  gender?: string;

  @ApiPropertyOptional({
    example: '+84901234567',
    description: 'Patient phone number.',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'patient001@smile.com',
    description: 'Patient email address.',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '123 Nguyen Trai',
    description: 'Street address.',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'Ward 1',
  })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional({
    example: 'District 1',
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({
    example: 'Ho Chi Minh City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Nguyen Van B',
    description: 'Emergency contact name.',
  })
  @IsString()
  @IsOptional()
  emergency_contact?: string;

  @ApiPropertyOptional({
    example: '+84909888777',
    description: 'Emergency contact phone number.',
  })
  @IsString()
  @IsOptional()
  emergency_phone?: string;

  @ApiPropertyOptional({
    example: 'O+',
    enum: BLOOD_TYPES,
  })
  @IsOptional()
  @Transform(toUpper)
  @IsIn(BLOOD_TYPES)
  blood_type?: string;

  @ApiPropertyOptional({
    example: ['penicillin'],
    type: [String],
    description: 'Known allergies.',
  })
  @IsArray()
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    example: ['asthma'],
    type: [String],
    description: 'Known chronic diseases.',
  })
  @IsArray()
  @IsOptional()
  chronic_diseases?: string[];

  @ApiPropertyOptional({
    example: 'BH-001',
  })
  @IsString()
  @IsOptional()
  insurance_number?: string;

  @ApiPropertyOptional({
    example: 'Bao Viet',
  })
  @IsString()
  @IsOptional()
  insurance_provider?: string;
}
