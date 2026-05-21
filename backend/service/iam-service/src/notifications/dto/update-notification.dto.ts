import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsInt } from 'class-validator';
import { NotificationStatus } from '../domain/notification-template';

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  retryCount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  nextRetryAt?: string;
}
