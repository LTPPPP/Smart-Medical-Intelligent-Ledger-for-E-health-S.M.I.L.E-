import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
