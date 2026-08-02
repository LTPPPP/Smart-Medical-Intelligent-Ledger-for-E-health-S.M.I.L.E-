import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  Min,
  IsEnum,
} from 'class-validator';
import { ScheduleStatus } from '../../utils/enums/schedule-status.enum';

// Selects Left On Their "None" Option Post `''`, Not `undefined` — Cast That
// To `undefined` Before Validation So It Doesn't Reach A `uuid` Column.
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class UpdateDoctorScheduleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  shift_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  room_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_patients?: number;

  @ApiProperty({ required: false, enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ required: false, description: 'Id of user making the change' })
  @IsOptional()
  @IsString()
  changed_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  change_reason?: string;
}
