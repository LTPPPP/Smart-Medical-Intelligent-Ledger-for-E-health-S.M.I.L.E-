import { IsString, IsOptional } from 'class-validator';

export class CreateRecordExportDto {
  @IsString()
  patient_id: string;

  @IsString()
  record_id: string;

  @IsString()
  export_type: string;

  @IsString()
  export_format: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  exported_by: string;

  @IsOptional()
  expires_at?: Date;
}
