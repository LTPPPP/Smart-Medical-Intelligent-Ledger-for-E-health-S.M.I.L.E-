import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransferScheduleDto {
  @ApiProperty({ description: 'UUID of the doctor to transfer the shift to' })
  @IsUUID()
  to_doctor_id: string;

  @ApiProperty({ description: 'UUID of the user initiating the transfer' })
  @IsUUID()
  transferred_by: string;

  @ApiProperty({ description: 'Reason for shift transfer' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
