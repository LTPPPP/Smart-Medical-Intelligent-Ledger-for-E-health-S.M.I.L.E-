import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { LeaveType } from '../../utils/enums/leave-type.enum';

export class CreateDoctorLeaveDto {
  @ApiProperty({ description: 'Doctor UUID from user-service' })
  @IsUUID()
  doctor_id: string;

  @ApiProperty({ required: false, enum: LeaveType })
  @IsOptional()
  @IsEnum(LeaveType)
  leave_type?: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2026-03-12' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
