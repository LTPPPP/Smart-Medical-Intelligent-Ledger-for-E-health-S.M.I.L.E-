import {
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateExaminationSessionDto {
  @IsUUID()
  @IsOptional()
  appointment_id?: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsUUID()
  @IsOptional()
  patient_id?: string;

  @IsUUID()
  @IsOptional()
  doctor_id?: string;

  @IsUUID()
  @IsOptional()
  clinic_id?: string;

  @IsDateString()
  @IsOptional()
  session_date?: string;

  @IsString()
  @IsOptional()
  chief_complaint?: string;

  @IsString()
  @IsOptional()
  present_illness?: string;

  @IsString()
  @IsOptional()
  physical_examination?: string;

  @IsObject()
  @IsOptional()
  vital_signs?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  started_at?: string;

  @IsDateString()
  @IsOptional()
  completed_at?: string;
}
