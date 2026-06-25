import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    required: false,
    description: 'Amount to refund. Defaults to full payment amount.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, description: 'Reason for the refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}
