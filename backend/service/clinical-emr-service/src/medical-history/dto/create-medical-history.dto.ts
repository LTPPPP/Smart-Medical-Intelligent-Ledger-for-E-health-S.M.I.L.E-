import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMedicalHistoryDto {
  @IsString()
  patient_id: string;

  @IsString()
  condition_name: string;

  @IsString()
  @IsOptional()
  condition_type?: string;

  @IsDateString()
  @IsOptional()
  diagnosed_date?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMedicalHistoryDto {
  @IsString()
  @IsOptional()
  condition_name?: string;

  @IsString()
  @IsOptional()
  condition_type?: string;

  @IsDateString()
  @IsOptional()
  diagnosed_date?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
