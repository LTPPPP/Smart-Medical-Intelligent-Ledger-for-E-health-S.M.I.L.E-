import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class RevenueQueryDto {
  @ApiProperty({ example: '2026-01-01', description: 'Start date (inclusive)' })
  @IsString()
  date_from: string;

  @ApiProperty({ example: '2026-12-31', description: 'End date (inclusive)' })
  @IsString()
  date_to: string;

  @ApiPropertyOptional({ description: 'Filter by clinic' })
  @IsOptional()
  @IsUUID()
  clinic_id?: string;

  @ApiPropertyOptional({
    enum: ['day', 'service', 'clinic'],
    description: 'Primary grouping for the report',
  })
  @IsOptional()
  @IsIn(['day', 'service', 'clinic'])
  group_by?: 'day' | 'service' | 'clinic';
}
