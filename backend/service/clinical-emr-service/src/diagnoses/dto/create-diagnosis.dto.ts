import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateDiagnosisDto {
  @IsUUID()
  session_id: string;

  @IsString()
  @IsOptional()
  icd_code?: string;

  @IsString()
  diagnosis_name: string;

  @IsString()
  @IsOptional()
  diagnosis_type?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
