import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// Front-Desk Arrival Assignment
export class CheckInAssignDto {
  @ApiProperty({ description: 'Doctor UUID to assign for this visit' })
  @IsUUID()
  doctor_id: string;

  @ApiProperty({ required: false, description: 'Service UUID' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Treatment room UUID (defaults to the doctor’s scheduled room)',
  })
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiProperty({
    description: 'UUID of the staff member checking the patient in',
  })
  @IsUUID()
  checked_in_by: string;
}
