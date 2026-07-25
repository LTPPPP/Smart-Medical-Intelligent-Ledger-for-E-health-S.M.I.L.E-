import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { AppointmentType } from '../../utils/enums/appointment-type.enum';

export class BookByDoctorDto {
  @ApiProperty({ description: 'Doctor UUID (required for this booking type)' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ description: 'Patient UUID' })
  @IsString()
  patient_id: string;

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

  @ApiProperty({ example: '2026-06-01' })
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
  appointment_type?: AppointmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chief_complaint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'UUID of user creating the appointment' })
  @IsString()
  created_by: string;
}
