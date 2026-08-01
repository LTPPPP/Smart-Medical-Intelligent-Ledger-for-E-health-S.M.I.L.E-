import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'UUID of user cancelling the appointment' })
  @IsString()
  @IsNotEmpty()
  cancelled_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}
