import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDoctorScheduleDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Filter by doctor UUID' })
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiProperty({ required: false, description: 'Filter by clinic UUID' })
  @IsOptional()
  @IsUUID()
  clinic_id?: string;

  @ApiProperty({ required: false, description: 'Filter by work date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  work_date?: string;

  @ApiProperty({ required: false, description: 'Start date range' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({ required: false, description: 'End date range' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
