import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../utils/enums/appointment-status.enum';

export class ChangeAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: string;

  @ApiProperty({ description: 'UUID of user making the status change' })
  @IsUUID()
  changed_by: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
