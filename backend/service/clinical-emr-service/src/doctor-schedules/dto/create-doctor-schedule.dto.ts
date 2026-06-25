import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ScheduleStatus } from '../../utils/enums/schedule-status.enum';

// Cross-service ids (doctor/clinic/shift/room) are not strictly validated as v4 UUIDs.
export class CreateDoctorScheduleDto {
  @ApiProperty({ description: 'Doctor id from user-service' })
  @IsString()
  @IsNotEmpty()
  doctor_id: string;

  @ApiProperty({ description: 'Clinic id' })
  @IsString()
  @IsNotEmpty()
  clinic_id: string;

  @ApiProperty({ required: false, description: 'Work shift id' })
  @IsOptional()
  @IsString()
  shift_id?: string | null;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  work_date: string;

  @ApiProperty({ required: false, description: 'Treatment room id' })
  @IsOptional()
  @IsString()
  room_id?: string | null;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_patients?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ required: false, enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
