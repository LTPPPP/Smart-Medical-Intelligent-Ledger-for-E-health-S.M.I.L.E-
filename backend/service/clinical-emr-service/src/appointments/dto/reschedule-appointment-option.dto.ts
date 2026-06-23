import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RescheduleAppointmentOptionDto {
  @ApiProperty({ description: 'Opaque appointment option token from availability lookup' })
  @IsString()
  option_token: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'UUID of user updating the appointment' })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}
