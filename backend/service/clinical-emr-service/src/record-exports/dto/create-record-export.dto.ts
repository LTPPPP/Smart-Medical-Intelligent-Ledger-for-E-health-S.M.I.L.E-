import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRecordExportDto {
  @IsUUID()
  patient_id: string;

  @IsUUID()
  record_id: string;

  @IsString()
  export_type: string;

  @IsString()
  export_format: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsUUID()
  exported_by: string;

  @IsOptional()
  expires_at?: Date;
}
