import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../../utils/enums/appointment-status.enum';
import { AppointmentType } from '../../utils/enums/appointment-type.enum';
import { PaymentStatus } from '../../utils/enums/payment-status.enum';

export class QueryAppointmentDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patient_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doctor_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clinic_id?: string;

  @ApiProperty({ required: false, enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ required: false, enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  treatment_plan_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_outside_hours?: boolean;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;
}
