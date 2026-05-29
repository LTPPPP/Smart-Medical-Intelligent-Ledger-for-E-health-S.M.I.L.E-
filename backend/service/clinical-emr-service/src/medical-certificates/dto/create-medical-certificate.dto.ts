import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MedicalCertificateType } from '../entities/medical-certificate.entity';

export class CreateMedicalCertificateDto {
  @IsUUID()
  session_id: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsUUID()
  patient_id: string;

  @IsEnum(MedicalCertificateType)
  @IsOptional()
  cert_type?: MedicalCertificateType;

  @IsDateString()
  issued_date: string; // Ngày cấp

  @IsDateString()
  @IsOptional()
  valid_from?: string; // Ngày bắt đầu nghỉ

  @IsDateString()
  @IsOptional()
  valid_to?: string; // Ngày kết thúc nghỉ

  @IsInt()
  @Min(1)
  @Max(180)
  @IsOptional()
  @Type(() => Number)
  days_granted?: number; // Số ngày nghỉ

  @IsString()
  @IsOptional()
  reason?: string; // Lý do

  @IsString()
  @IsOptional()
  restrictions?: string; // Hạn chế / lưu ý

  @IsUUID()
  doctor_id: string;

  @IsString()
  @IsOptional()
  doctor_name_snapshot?: string;

  @IsString()
  @IsOptional()
  doctor_license_number?: string;

  @IsUUID()
  @IsOptional()
  doctor_signature_id?: string;
}
