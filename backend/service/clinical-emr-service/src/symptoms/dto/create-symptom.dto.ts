import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Severity } from '../../utils/enums/severity.enum';

export class CreateSymptomDto {
  @IsString()
  session_id: string;

  @IsString()
  @IsOptional()
  patient_id?: string;

  @IsString()
  symptom_name: string;

  @IsString()
  @IsOptional()
  body_location?: string;

  @IsString()
  @IsOptional()
  severity?: Severity;

  @IsDateString()
  @IsOptional()
  onset_date?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  recorded_by: string;
}
