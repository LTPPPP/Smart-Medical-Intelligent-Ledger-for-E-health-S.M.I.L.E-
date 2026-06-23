import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum AppointmentAvailabilityTimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
}

export class QueryAppointmentAvailabilityDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiProperty()
  @IsUUID()
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
