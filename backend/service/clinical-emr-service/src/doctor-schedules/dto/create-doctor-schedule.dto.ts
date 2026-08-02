import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  IsUUID,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ScheduleStatus } from '../../utils/enums/schedule-status.enum';

// Selects Left On Their "None" Option Post `''`, Not `undefined` — Cast That
// To `undefined` Before Validation So It Doesn't Reach A `uuid` Column.
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

// Cross Service Ids
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
  @Transform(emptyToUndefined)
  @IsUUID()
  shift_id?: string | null;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  work_date: string;

  @ApiProperty({ required: false, description: 'Treatment room id' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
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
