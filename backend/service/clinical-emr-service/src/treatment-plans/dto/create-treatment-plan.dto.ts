import { IsUUID, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateTreatmentPlanDto {
  @IsUUID()
  @IsOptional()
  session_id?: string;

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
  estimated_cost?: string | number;

  @IsString()
  @IsOptional()
  quote_currency?: string;

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

  @IsOptional()
  proposed_at?: Date;

  @IsOptional()
  accepted_at?: Date;

  @IsUUID()
  @IsOptional()
  accepted_by?: string;

  @IsOptional()
  declined_at?: Date;

  @IsUUID()
  @IsOptional()
  declined_by?: string;

  @IsString()
  @IsOptional()
  decline_reason?: string;

  @IsUUID()
  created_by: string;
}
