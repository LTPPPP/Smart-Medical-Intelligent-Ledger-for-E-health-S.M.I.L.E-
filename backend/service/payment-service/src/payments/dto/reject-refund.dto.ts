import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectRefundDto {
  @ApiProperty({ description: 'Reason the refund request was rejected' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
