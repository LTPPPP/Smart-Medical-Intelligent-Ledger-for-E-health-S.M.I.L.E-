import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateDoctorScheduleDto {
  @ApiProperty({ description: 'Doctor UUID from user-service' })
  @IsUUID()
  doctor_id: string;

  @ApiProperty({ description: 'Clinic UUID' })
  @IsUUID()
  clinic_id: string;

  @ApiProperty({ required: false, description: 'Work shift UUID' })
  @IsOptional()
  @IsUUID()
  shift_id?: string | null;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  work_date: string;

  @ApiProperty({ required: false, description: 'Treatment room UUID' })
  @IsOptional()
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
}
