import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

// Front-desk arrival flow for walk-in-style bookings (facility/specialty/outside-hours)
// that were auto-assigned a placeholder doctor at booking time: reception picks the
// real doctor (from who's actually scheduled that day), service, and room once the
// patient is physically present.
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
    description: 'Treatment room UUID (defaults to the doctor’s scheduled room)',
  })
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiProperty({ description: 'UUID of the staff member checking the patient in' })
  @IsUUID()
  checked_in_by: string;
}
