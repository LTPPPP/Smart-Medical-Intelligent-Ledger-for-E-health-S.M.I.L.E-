import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { Severity } from '../../utils/enums/severity.enum';

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

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsString()
  @IsOptional()
  notes?: string;
}
