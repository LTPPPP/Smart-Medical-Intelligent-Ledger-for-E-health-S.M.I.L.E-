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
import { RoomType } from '../../utils/enums/room-type.enum';

export class CreateTreatmentRoomDto {
  @ApiProperty({ example: 'Examination Room 1' })
  @IsString()
  @MaxLength(100)
  room_name: string;

  @ApiProperty({ example: 'EXAM1' })
  @IsString()
  @MaxLength(50)
  room_code: string;

  @ApiProperty({ enum: RoomType, example: RoomType.EXAMINATION })
  @IsEnum(RoomType)
  room_type: RoomType;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  floor_number?: number | null;

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
  status?: RoomStatus;
}
