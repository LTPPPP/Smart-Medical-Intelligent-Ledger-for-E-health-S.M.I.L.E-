import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsUUID()
  patient_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinic_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointment_type?: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payment_status?: string;
}
