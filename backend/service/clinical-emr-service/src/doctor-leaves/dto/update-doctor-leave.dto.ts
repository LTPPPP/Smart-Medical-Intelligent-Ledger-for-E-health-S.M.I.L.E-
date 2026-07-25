import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApprovalStatus } from '../../utils/enums/approval-status.enum';

export class UpdateDoctorLeaveDto {
  @ApiProperty({ required: false, enum: ApprovalStatus })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @ApiProperty({ required: false, description: 'UUID of approver' })
  @IsOptional()
  @IsUUID()
  approved_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
