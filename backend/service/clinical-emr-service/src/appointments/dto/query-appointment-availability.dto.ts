import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID, IsEnum, Matches } from 'class-validator';

export enum AppointmentAvailabilityTimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
}

export class QueryAppointmentAvailabilityDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiProperty()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'service_id must be a UUID-like identifier',
  })
  service_id: string;

  @ApiProperty()
  @IsDateString()
  date_from: string;

  @ApiProperty()
  @IsDateString()
  date_to: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinic_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiProperty({ required: false, enum: AppointmentAvailabilityTimeOfDay })
  @IsOptional()
  @IsEnum(AppointmentAvailabilityTimeOfDay)
  time_of_day?: AppointmentAvailabilityTimeOfDay;
}
