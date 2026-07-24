import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateImageAnnotationDto {
  @IsString()
  image_id: string;

  @IsString()
  annotated_by: string;

  @IsString()
  @IsOptional()
  annotation_type?: string;

  @IsObject()
  @IsOptional()
  annotation_data?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  note?: string;
}
