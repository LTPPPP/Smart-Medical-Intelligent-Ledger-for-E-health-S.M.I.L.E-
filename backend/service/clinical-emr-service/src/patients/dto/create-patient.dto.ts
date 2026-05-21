import {
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreatePatientDto {
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsString()
  patient_code: string;

  @IsString()
  full_name: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  emergency_contact?: string;

  @IsString()
  @IsOptional()
  emergency_phone?: string;

  @IsString()
  @IsOptional()
  blood_type?: string;

  @IsArray()
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsOptional()
  chronic_diseases?: string[];

  @IsString()
  @IsOptional()
  insurance_number?: string;

  @IsString()
  @IsOptional()
  insurance_provider?: string;
}
