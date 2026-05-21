import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  IsObject,
  IsEnum,
} from 'class-validator';
import { RoomStatus } from '../../utils/enums/room-status.enum';

export class CreateTreatmentRoomDto {
  @ApiProperty({ example: 'Examination Room 1' })
  @IsString()
  @MaxLength(100)
  room_name: string;

  @ApiProperty({ example: 'EXAM1' })
  @IsString()
  @MaxLength(50)
  room_code: string;

  @ApiProperty({ required: false, example: 'examination' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_type?: string | null;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  floor_number?: number | null;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsInt()
  capacity?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  equipment_list?: Record<string, any> | null;

  @ApiProperty({
    required: false,
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: string;
}
