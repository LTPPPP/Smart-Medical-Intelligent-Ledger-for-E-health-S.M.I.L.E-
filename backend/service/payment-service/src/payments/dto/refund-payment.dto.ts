import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    required: false,
    description: 'Amount to refund. Defaults to full payment amount.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiProperty({ required: false, description: 'Reason for the refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}
