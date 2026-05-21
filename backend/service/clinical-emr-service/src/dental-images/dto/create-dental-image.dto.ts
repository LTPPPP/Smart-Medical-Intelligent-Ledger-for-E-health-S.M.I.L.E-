import {
  IsInt,
  IsOptional,
  IsUUID,
  IsString,
  IsArray,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';

export class CreateDentalImageDto {
  @IsUUID()
  patient_id: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsString()
  image_type: string;

  @IsString()
  image_url: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsInt()
  @IsOptional()
  file_size_kb?: number;

  @IsString()
  @IsOptional()
  file_format?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  tooth_numbers?: number[];

  @IsString()
  @IsOptional()
  view_angle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  pacs_id?: string;

  @IsDateString()
  @IsOptional()
  taken_date?: string;

  @IsUUID()
  @IsOptional()
  taken_by?: string;

  @IsUUID()
  uploaded_by: string;

  @IsBoolean()
  @IsOptional()
  is_archived?: boolean;
}
