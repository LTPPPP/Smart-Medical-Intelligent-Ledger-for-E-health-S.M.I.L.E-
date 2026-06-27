import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class BookBySpecialtyDto {
  @ApiProperty({ description: 'Specialty UUID to book appointment for' })
  @IsString()
  specialty_id: string;

  @ApiProperty({ description: 'Patient UUID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Clinic UUID' })
  @IsString()
  clinic_id: string;

  @ApiProperty({
    required: false,
    example: '2026-06-01',
    description: 'Preferred appointment date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  preferred_date?: string;

  @ApiProperty({
    required: false,
    example: '09:00',
    description: 'Preferred appointment time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  preferred_time?: string;

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  duration_minutes?: number;

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
