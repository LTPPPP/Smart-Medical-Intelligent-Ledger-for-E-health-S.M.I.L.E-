import {
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  IsArray,
  IsUUID,
  IsEnum,
  MaxLength,
  IsPhoneNumber,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderEnum } from '../enums/gender.enum';
import { BloodTypeEnum } from '../enums/blood-type.enum';

export class CreatePatientDto {
  @ApiPropertyOptional({ description: 'Linked user account ID' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ description: 'Full name of the patient', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  full_name: string;

  @ApiPropertyOptional({
    description: 'Date of birth (ISO 8601)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: GenderEnum, description: 'Patient gender' })
  @IsEnum(GenderEnum)
  @IsOptional()
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'patient@example.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ward?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Emergency contact full name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  emergency_contact?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergency_phone?: string;

  @ApiPropertyOptional({ enum: BloodTypeEnum })
  @IsEnum(BloodTypeEnum)
  @IsOptional()
  blood_type?: BloodTypeEnum;

  @ApiPropertyOptional({ type: [String], example: ['Penicillin', 'Pollen'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Diabetes', 'Hypertension'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  chronic_diseases?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  insurance_number?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  insurance_provider?: string;
}
