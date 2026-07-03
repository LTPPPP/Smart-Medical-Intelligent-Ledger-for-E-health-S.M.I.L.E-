import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class AcceptTreatmentPlanDto {
  @IsUUID()
  accepted_by: string;

  @IsIn(['full', 'partial'])
  @IsOptional()
  acceptance_scope?: 'full' | 'partial';

  @IsString()
  @IsOptional()
  accepted_scope_note?: string;
}
