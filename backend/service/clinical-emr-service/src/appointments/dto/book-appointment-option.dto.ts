import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentType } from '../../utils/enums/appointment-type.enum';

export class BookAppointmentOptionDto {
  @ApiProperty({ description: 'Patient UUID' })
  @IsUUID()
  patient_id: string;

  @ApiProperty({
    description: 'Opaque appointment option token from availability lookup',
  })
  @IsString()
  option_token: string;

  @ApiProperty({ required: false, enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chief_complaint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'UUID of user creating the appointment' })
  @IsUUID()
  created_by: string;
}
