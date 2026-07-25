import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../utils/enums/appointment-status.enum';

export class ChangeAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ description: 'UUID of user making the status change' })
  @IsString()
  changed_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
