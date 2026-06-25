import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateTreatmentHistoryDto {
  @IsString()
  record_id: string;

  @IsString()
  patient_id: string;

  @IsDateString()
  treatment_date: string;

  @IsArray()
  @IsOptional()
  tooth_numbers?: number[];

  @IsString()
  @IsOptional()
  procedure_code?: string;

  @IsString()
  procedure_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  performed_by: string;
}
