import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ReferralUrgency } from '../entities/referral.entity';

export class CreateReferralDto {
  @IsUUID()
  session_id: string;

  @IsUUID()
  patient_id: string;

  @IsUUID()
  from_clinic_id: string;

  @IsString()
  @IsOptional()
  from_clinic_name_snapshot?: string;

  @IsString()
  to_facility_name: string; // Tên cơ sở y tế tiếp nhận

  @IsString()
  @IsOptional()
  to_facility_address?: string;

  @IsString()
  @IsOptional()
  to_department?: string; // Khoa tiếp nhận

  @IsString()
  @IsOptional()
  to_doctor_name?: string; // Bác sĩ tiếp nhận (nếu biết)

  @IsString()
  referral_reason: string; // Lý do chuyển viện

  @IsString()
  @IsOptional()
  clinical_summary?: string; // Tóm tắt bệnh án gửi kèm

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accompanying_documents?: string[]; // URLs tài liệu đính kèm

  @IsEnum(ReferralUrgency)
  @IsOptional()
  urgency?: ReferralUrgency;

  @IsUUID()
  issued_by: string; // doctor_id

  @IsString()
  @IsOptional()
  issued_by_name_snapshot?: string;

  @IsDateString()
  @IsOptional()
  valid_until?: string; // Giấy có hiệu lực đến
}
