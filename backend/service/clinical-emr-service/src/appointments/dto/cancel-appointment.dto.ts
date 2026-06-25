import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'UUID of user cancelling the appointment' })
  @IsString()
  cancelled_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}
