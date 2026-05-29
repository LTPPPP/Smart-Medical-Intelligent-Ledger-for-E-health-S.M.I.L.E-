import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExaminationSessionStatus } from '../entities/examination-session.entity';

export class CreateExaminationSessionDto {
  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsUUID()
  patient_id: string;

  @IsUUID()
  doctor_id: string;

  @IsUUID()
  clinic_id: string;

  // Snapshot fields (denormalized for self-contained forms)
  @IsString()
  @IsOptional()
  doctor_name_snapshot?: string;

  @IsString()
  @IsOptional()
  clinic_name_snapshot?: string;

  @IsDateString()
  @IsOptional()
  session_date?: string;

  // --- Anamnesis ---
  @IsString()
  @IsOptional()
  chief_complaint?: string; // Lý do khám

  @IsString()
  @IsOptional()
  present_illness?: string; // Bệnh sử

  @IsString()
  @IsOptional()
  family_history?: string; // Tiền sử gia đình

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergy_snapshot?: string[]; // Snapshot dị ứng tại thời điểm khám

  // --- Physical Examination ---
  @IsString()
  @IsOptional()
  physical_examination?: string; // Khám thực thể

  @IsString()
  @IsOptional()
  clinical_description?: string; // Mô tả lâm sàng

  // --- Vital Signs (typed) ---
  @IsInt()
  @Min(0)
  @Max(300)
  @IsOptional()
  @Type(() => Number)
  bp_systolic?: number; // mmHg

  @IsInt()
  @Min(0)
  @Max(200)
  @IsOptional()
  @Type(() => Number)
  bp_diastolic?: number; // mmHg

  @IsInt()
  @Min(0)
  @Max(300)
  @IsOptional()
  @Type(() => Number)
  pulse_rate?: number; // bpm

  @IsNumber()
  @Min(30)
  @Max(45)
  @IsOptional()
  @Type(() => Number)
  temperature_celsius?: number; // °C

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  spo2_percent?: number; // %

  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  @Type(() => Number)
  respiratory_rate?: number; // breaths/min

  @IsNumber()
  @Min(0)
  @Max(300)
  @IsOptional()
  @Type(() => Number)
  weight_kg?: number; // kg

  @IsNumber()
  @Min(0)
  @Max(300)
  @IsOptional()
  @Type(() => Number)
  height_cm?: number; // cm

  // bmi is auto-calculated, but can be overridden
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bmi?: number;

  // --- Follow-up ---
  @IsDateString()
  @IsOptional()
  follow_up_date?: string; // Ngày tái khám

  @IsString()
  @IsOptional()
  follow_up_notes?: string; // Hướng dẫn tái khám

  // --- Status & timing ---
  @IsEnum(ExaminationSessionStatus)
  @IsOptional()
  status?: ExaminationSessionStatus;

  @IsDateString()
  @IsOptional()
  started_at?: string;

  @IsDateString()
  @IsOptional()
  completed_at?: string;

  // --- Data Protection ---
  @IsString()
  @IsOptional()
  data_consent_version?: string; // Phiên bản consent bệnh nhân
}
