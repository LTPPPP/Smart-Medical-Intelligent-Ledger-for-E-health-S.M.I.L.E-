import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ApproveRefundDto {
  @ApiProperty({
    required: false,
    description:
      'Amount to refund. Defaults to the amount captured in the request (or the full payment).',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;
}
