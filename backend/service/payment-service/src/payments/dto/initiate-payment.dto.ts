import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InitiatePaymentDto {
  // Appointment id is owned by another service; not strictly validated as a v4 UUID.
  @ApiProperty({ description: 'Appointment id to pay for' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ description: 'Amount to charge (VND)', example: 200000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, description: 'Order/payment description' })
  @IsOptional()
  @IsString()
  orderInfo?: string;
}
