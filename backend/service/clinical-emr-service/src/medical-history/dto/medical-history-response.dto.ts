import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { HistoryTypeEnum } from '../enums/history-type.enum';
import { SeverityEnum } from '../enums/severity.enum';

@Exclude()
export class MedicalHistoryResponseDto {
  @Expose()
  @ApiProperty()
  history_id: string;

  @Expose()
  @ApiProperty()
  patient_id: string;

  @Expose()
  @ApiProperty()
  condition_name: string;

  @Expose()
  @ApiProperty({ enum: HistoryTypeEnum })
  condition_type: HistoryTypeEnum;

  @Expose()
  @ApiPropertyOptional()
  diagnosed_date: Date | null;

  @Expose()
  @ApiPropertyOptional()
  resolution_date: Date | null;

  @Expose()
  @ApiPropertyOptional({ enum: SeverityEnum })
  severity: SeverityEnum | null;

  @Expose()
  @ApiProperty()
  is_active: boolean;

  @Expose()
  @ApiPropertyOptional()
  treatment: string | null;

  @Expose()
  @ApiPropertyOptional()
  notes: string | null;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;
}
