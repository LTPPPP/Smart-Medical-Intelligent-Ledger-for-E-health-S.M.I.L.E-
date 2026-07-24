import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export const PHONE_PATTERN = /^\+?[0-9][0-9 .()-]{7,24}$/;
export const DOCUMENT_TYPE_PATTERN = /^[A-Za-z0-9 _-]{2,40}$/;
export const DOCUMENT_NUMBER_PATTERN = /^[A-Za-z0-9._/-]{4,40}$/;

export class CreatePatientRepresentativeDto {
  @IsUUID()
  patient_id: string;

  @IsString()
  @MaxLength(255)
  full_name: string;

  @IsString()
  @MaxLength(100)
  relationship: string;

  @IsString()
  @MaxLength(25)
  @Matches(PHONE_PATTERN)
  phone: string;

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
  authorized_for_treatment?: boolean;

  @IsOptional()
  @IsBoolean()
  authorized_for_payment?: boolean;

  @IsOptional()
  @IsBoolean()
  authorized_for_records?: boolean;
}
