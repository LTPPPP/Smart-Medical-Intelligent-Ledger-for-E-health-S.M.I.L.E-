import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HistoryTypeEnum } from '../enums/history-type.enum';
import { SeverityEnum } from '../enums/severity.enum';

export class CreateMedicalHistoryDto {
  @ApiProperty({ description: 'Patient ID (UUID)' })
  @IsUUID()
  patient_id: string;

  @ApiProperty({ description: 'Name of the condition / disease', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  condition_name: string;

  @ApiPropertyOptional({ enum: HistoryTypeEnum, default: HistoryTypeEnum.OTHER })
  @IsEnum(HistoryTypeEnum)
  @IsOptional()
  condition_type?: HistoryTypeEnum;

  @ApiPropertyOptional({ example: '2010-03-15', description: 'Date diagnosed (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  diagnosed_date?: string;

  @ApiPropertyOptional({ example: '2012-06-01', description: 'Date resolved (ISO 8601), null if ongoing' })
  @IsDateString()
  @IsOptional()
  resolution_date?: string;

  @ApiPropertyOptional({ enum: SeverityEnum })
  @IsEnum(SeverityEnum)
  @IsOptional()
  severity?: SeverityEnum;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  treatment?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
