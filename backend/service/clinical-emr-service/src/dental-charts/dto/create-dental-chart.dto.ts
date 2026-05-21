import { IsInt, IsOptional, IsUUID, IsString, IsObject } from 'class-validator';

export class CreateDentalChartDto {
  @IsUUID()
  patient_id: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsInt()
  tooth_number: number;

  @IsString()
  @IsOptional()
  tooth_status?: string;

  @IsObject()
  @IsOptional()
  surfaces?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  notes?: string;
}
