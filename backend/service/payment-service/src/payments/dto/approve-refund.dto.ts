import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ApproveRefundDto {
  @ApiProperty({
    required: false,
    description:
      'Amount to refund. Defaults to the amount captured in the request (or the full payment).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
