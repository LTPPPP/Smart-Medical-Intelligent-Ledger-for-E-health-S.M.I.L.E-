import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePatientRepresentativeDto {
  @IsUUID()
  patient_id: string;

  @IsString()
  full_name: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  legal_document_type?: string | null;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsUUID()
  verified_by?: string | null;
}
