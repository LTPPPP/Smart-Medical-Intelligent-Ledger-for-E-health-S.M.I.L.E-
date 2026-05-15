import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ScheduleStatus } from '../../utils/enums/schedule-status.enum';

export class UpdateDoctorScheduleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  shift_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  room_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_patients?: number;

  @ApiProperty({ required: false, enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ description: 'UUID of user making the change' })
  @IsUUID()
  changed_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  change_reason?: string;
}
