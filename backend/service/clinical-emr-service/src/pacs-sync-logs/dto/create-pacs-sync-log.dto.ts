import { IsOptional, IsUUID, IsString } from 'class-validator';

export class CreatePacsSyncLogDto {
  @IsUUID()
  @IsOptional()
  image_id?: string;

  @IsString()
  @IsOptional()
  sync_type?: string;

  @IsString()
  @IsOptional()
  pacs_server?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  error_message?: string;
}
