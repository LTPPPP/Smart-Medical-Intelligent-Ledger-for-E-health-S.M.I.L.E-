import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsUUID() patient_id: string;
  @IsUUID() @IsOptional() appointment_id?: string;
  @IsUUID() clinic_id: string;
  @IsUUID() doctor_id: string;
  @IsDateString() visit_date: string;
  @IsString() @IsOptional() chief_complaint?: string;
  @IsString() @IsOptional() diagnosis?: string;
  @IsString() @IsOptional() treatment_plan?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() record_status?: string;
}

export class UpdateMedicalRecordDto {
  @IsString() @IsOptional() chief_complaint?: string;
  @IsString() @IsOptional() diagnosis?: string;
  @IsString() @IsOptional() treatment_plan?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() record_status?: string;
  @IsString() @IsOptional() record_hash?: string;
  @IsString() @IsOptional() blockchain_tx_id?: string;
}
