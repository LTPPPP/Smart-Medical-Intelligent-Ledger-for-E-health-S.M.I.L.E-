import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'UUID of user cancelling the appointment' })
  @IsUUID()
  cancelled_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}
