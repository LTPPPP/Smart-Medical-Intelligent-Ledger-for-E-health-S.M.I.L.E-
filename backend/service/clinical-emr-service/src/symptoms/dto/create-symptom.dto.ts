import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateSymptomDto {
  @IsUUID()
  session_id: string;

  @IsUUID()
  @IsOptional()
  patient_id?: string;

  @IsString()
  symptom_name: string;

  @IsString()
  @IsOptional()
  body_location?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsDateString()
  @IsOptional()
  onset_date?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  recorded_by: string;
}
