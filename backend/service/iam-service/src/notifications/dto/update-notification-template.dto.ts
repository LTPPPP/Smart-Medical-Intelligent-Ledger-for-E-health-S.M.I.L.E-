import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { NotificationChannel } from '../domain/notification-template';

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subjectTemplate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bodyTemplate?: string;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
