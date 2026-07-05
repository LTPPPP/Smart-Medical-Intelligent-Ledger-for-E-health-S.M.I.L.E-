import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsString() patient_id: string;
  @IsString() @IsOptional() appointment_id?: string;
  @IsString() clinic_id: string;
  @IsString() doctor_id: string;
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
}
