import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  DOCUMENT_NUMBER_PATTERN,
  DOCUMENT_TYPE_PATTERN,
  PHONE_PATTERN,
} from './create-patient-representative.dto';

export class UpdatePatientRepresentativeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationship?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  @Matches(PHONE_PATTERN)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(DOCUMENT_TYPE_PATTERN)
  legal_document_type?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(DOCUMENT_NUMBER_PATTERN)
  legal_document_number?: string | null;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  authorized_for_treatment?: boolean;

  @IsOptional()
  @IsBoolean()
  authorized_for_payment?: boolean;

  @IsOptional()
  @IsBoolean()
  authorized_for_records?: boolean;
}
