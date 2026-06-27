import {
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
} from 'class-validator';

export class CreateExaminationSessionDto {
  @IsString()
  @IsOptional()
  record_id?: string;

  @IsString()
  patient_id: string;

  @IsString()
  doctor_id: string;

  @IsString()
  clinic_id: string;

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
