import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { ScheduleStatus } from '../../utils/enums/schedule-status.enum';

export class UpdateDoctorScheduleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shift_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  room_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_patients?: number;

  @ApiProperty({ required: false, enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ required: false, description: 'Id of user making the change' })
  @IsOptional()
  @IsString()
  changed_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  change_reason?: string;
}
