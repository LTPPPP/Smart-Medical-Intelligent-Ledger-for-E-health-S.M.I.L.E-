import { IsUUID, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateTreatmentPlanDto {
  @IsUUID()
  patient_id: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsString()
  @IsOptional()
  plan_name?: string;

  @IsString()
  @IsOptional()
  objectives?: string;

  @IsInt()
  @IsOptional()
  duration_weeks?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  sent_at?: Date;

  @IsUUID()
  @IsOptional()
  sent_to?: string;

  @IsString()
  @IsOptional()
  sent_via?: string;

  @IsOptional()
  confirmed_at?: Date;

  @IsUUID()
  created_by: string;
}
