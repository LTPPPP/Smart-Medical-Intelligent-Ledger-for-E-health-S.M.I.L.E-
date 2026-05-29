import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiagnosisType, DiagnosisSeverity } from '../entities/diagnosis.entity';

export class CreateDiagnosisDto {
  @IsUUID()
  session_id: string;

  @IsString()
  @IsOptional()
  icd_code?: string; // Mã ICD-10

  @IsString()
  diagnosis_name: string; // Tên chẩn đoán

  @IsEnum(DiagnosisType)
  @IsOptional()
  diagnosis_type?: DiagnosisType; // Loại chẩn đoán

  @IsEnum(DiagnosisSeverity)
  @IsOptional()
  severity?: DiagnosisSeverity; // Mức độ

  @IsString()
  @IsOptional()
  basis_of_diagnosis?: string; // Căn cứ chẩn đoán

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  diagnosis_order?: number; // Thứ tự ưu tiên

  @IsString()
  @IsOptional()
  notes?: string;
}
