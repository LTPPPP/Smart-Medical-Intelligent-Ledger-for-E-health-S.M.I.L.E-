import { IsOptional, IsUUID, IsString, IsObject } from 'class-validator';

export class CreateImageAnnotationDto {
  @IsUUID()
  image_id: string;

  @IsUUID()
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
