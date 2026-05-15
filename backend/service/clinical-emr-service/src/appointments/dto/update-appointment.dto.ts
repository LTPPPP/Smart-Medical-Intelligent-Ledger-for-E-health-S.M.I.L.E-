import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../../utils/enums/appointment-status.enum';
import { PaymentStatus } from '../../utils/enums/payment-status.enum';

export class UpdateAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  service_id?: string;

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
  @IsUUID()
  payment_id?: string;
}
