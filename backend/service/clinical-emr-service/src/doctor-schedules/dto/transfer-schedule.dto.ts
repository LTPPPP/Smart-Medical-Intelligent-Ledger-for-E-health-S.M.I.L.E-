import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class TransferScheduleDto {
  @ApiProperty({ description: 'Id of the doctor to transfer the shift to' })
  @IsString()
  @IsNotEmpty()
  to_doctor_id: string;

  @ApiProperty({ description: 'Id of the user initiating the transfer' })
  @IsString()
  @IsNotEmpty()
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
