import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { AppointmentType } from '../../utils/enums/appointment-type.enum';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient UUID from user-service' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Doctor UUID from user-service' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ description: 'Clinic UUID' })
  @IsString()
  clinic_id: string;

  @ApiProperty({ required: false, description: 'Treatment room UUID' })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ required: false, description: 'Service UUID' })
  @IsOptional()
  @IsString()
  service_id?: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  appointment_date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  appointment_time: string;

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  duration_minutes?: number;

  @ApiProperty({ required: false, enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chief_complaint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // UC-051: Outside hours
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_outside_hours?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  outside_hours_reason?: string;

  @ApiProperty({
    required: false,
    description: 'Admin UUID who approved outside-hours',
  })
  @IsOptional()
  @IsString()
  approved_by?: string;

  @ApiProperty({ description: 'UUID of user creating the appointment' })
  @IsString()
  created_by: string;
}
