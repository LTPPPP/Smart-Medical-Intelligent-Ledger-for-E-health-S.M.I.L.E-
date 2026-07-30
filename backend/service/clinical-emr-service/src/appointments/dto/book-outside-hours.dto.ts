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

export class BookOutsideHoursDto {
  // Either doctor_id (a specific doctor) or specialty_id (auto-assign the first
  // doctor with that specialty affiliated with the clinic) must be supplied —
  // enforced in AppointmentsService.createOutsideHours, not here, since it's a
  // cross-field rule class-validator can't express cleanly with both optional.
  @ApiProperty({ required: false, description: 'Doctor UUID' })
  @IsOptional()
  @IsString()
  doctor_id?: string;

  @ApiProperty({
    required: false,
    description: 'Specialty UUID — auto-assigns an affiliated doctor',
  })
  @IsOptional()
  @IsString()
  specialty_id?: string;

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

  @ApiProperty({ example: '20:00' })
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

  @ApiProperty({
    description: 'Reason for booking outside regular working hours (required)',
  })
  @IsString()
  outside_hours_reason: string;

  @ApiProperty({
    required: false,
    description: 'Admin UUID who approved this outside-hours booking',
  })
  @IsOptional()
  @IsString()
  approved_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'UUID of user creating the appointment' })
  @IsString()
  created_by: string;
}
