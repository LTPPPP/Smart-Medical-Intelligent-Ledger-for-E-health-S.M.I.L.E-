import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { OrderType } from '../../utils/enums/order-type.enum';
import { OrderPriority } from '../../utils/enums/order-priority.enum';

export class CreateDiagnosticOrderDto {
  @ApiProperty({ description: 'Appointment UUID' })
  @IsUUID()
  appointment_id: string;

  @ApiProperty({ description: 'Patient UUID' })
  @IsUUID()
  patient_id: string;

  @ApiProperty({ description: 'Doctor UUID' })
  @IsUUID()
  doctor_id: string;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  order_type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: OrderPriority, default: 'routine' })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: string;

  @ApiProperty({ required: false, example: '16' })
  @IsOptional()
  @IsString()
  tooth_number?: string;

  @ApiProperty({ required: false, example: 'lower-right quadrant' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
