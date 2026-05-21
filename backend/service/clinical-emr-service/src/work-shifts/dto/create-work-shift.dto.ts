import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsMilitaryTime,
} from 'class-validator';

export class CreateWorkShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @MaxLength(100)
  shift_name: string;

  @ApiProperty({ example: '08:00' })
  @IsMilitaryTime()
  start_time: string;

  @ApiProperty({ example: '12:00' })
  @IsMilitaryTime()
  end_time: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;
}
