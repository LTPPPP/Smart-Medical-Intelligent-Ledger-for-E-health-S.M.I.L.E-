import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';

// UC-048 (facility walk-in): patient picks only the clinic, date, and time — the
// specific doctor is auto-assigned server-side from whoever is scheduled at that
// clinic on that date; reception reassigns the real doctor/room/service on arrival.
export class BookByClinicDto {
  @ApiProperty({ description: 'Patient UUID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Clinic UUID' })
  @IsString()
  clinic_id: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  appointment_date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  appointment_time: string;

  @ApiProperty({ required: false, description: 'Specialty UUID (optional)' })
  @IsOptional()
  @IsString()
  specialty_id?: string;

  @ApiProperty({ required: false, description: 'Service UUID (optional)' })
  @IsOptional()
  @IsString()
  service_id?: string;

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  duration_minutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'UUID of user creating the appointment' })
  @IsString()
  created_by: string;
}
