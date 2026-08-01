import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { Severity } from '../../utils/enums/severity.enum';

export class CreateSymptomDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsOptional()
  patient_id?: string;

  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  recorded_by: string;
}
