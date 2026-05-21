import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateTreatmentHistoryDto {
  @IsUUID()
  record_id: string;

  @IsUUID()
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

  @IsUUID()
  performed_by: string;
}
