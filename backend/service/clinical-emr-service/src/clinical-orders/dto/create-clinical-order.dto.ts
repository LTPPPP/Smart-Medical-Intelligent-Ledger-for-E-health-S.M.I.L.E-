import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateClinicalOrderDto {
  @IsString()
  @IsOptional()
  record_id?: string;

  @IsString()
  patient_id: string;

  @IsString()
  ordered_by: string;

  @IsString()
  order_type: string;

  @IsString()
  test_type: string;

  @IsString()
  @IsOptional()
  clinical_indication?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  teeth_numbers?: number[];

  @IsString()
  @IsOptional()
  urgency?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  ordered_date?: string;

  @IsDateString()
  @IsOptional()
  scheduled_date?: string;

  @IsDateString()
  @IsOptional()
  completed_date?: string;

  @IsString()
  @IsOptional()
  result_url?: string;

  @IsString()
  @IsOptional()
  report?: string;
}
