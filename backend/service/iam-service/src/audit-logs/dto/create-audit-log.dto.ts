import { IsNotEmpty, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsNotEmpty()
  @IsString()
  action: string;

  @IsNotEmpty()
  @IsString()
  resource: string;

  @IsOptional()
  @IsUUID()
  resource_id?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
