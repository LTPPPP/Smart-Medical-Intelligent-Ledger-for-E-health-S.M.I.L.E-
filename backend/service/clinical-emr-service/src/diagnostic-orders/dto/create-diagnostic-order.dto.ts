import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { OrderType } from '../../utils/enums/order-type.enum';
import { OrderPriority } from '../../utils/enums/order-priority.enum';

export class CreateDiagnosticOrderDto {
  @ApiProperty({ description: 'Appointment UUID' })
  @IsString()
  appointment_id: string;

  @ApiProperty({ description: 'Patient UUID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Doctor UUID' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  order_type: OrderType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: OrderPriority, default: 'routine' })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

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
