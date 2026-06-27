import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../../utils/enums/payment-status.enum';
import { AppointmentType } from '../../utils/enums/appointment-type.enum';

export class UpdateAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  service_id?: string;

  @ApiProperty({ required: false, example: '2026-06-02' })
  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @ApiProperty({ required: false, example: '13:30' })
  @IsOptional()
  @IsString()
  appointment_time?: string;

  @ApiProperty({ required: false, enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: string;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payment_id?: string;

  @ApiProperty({ required: false, description: 'UUID of user updating the appointment' })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}
