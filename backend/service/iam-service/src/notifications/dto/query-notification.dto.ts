import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationStatus } from '../domain/notification-template';

export class FilterNotificationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notificationType?: string;
}

export class SortNotificationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  field?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';
}

export class QueryNotificationDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ type: FilterNotificationDto })
  @IsOptional()
  filters?: FilterNotificationDto;

  @ApiPropertyOptional({ type: [SortNotificationDto] })
  @IsOptional()
  sort?: SortNotificationDto[];
}
