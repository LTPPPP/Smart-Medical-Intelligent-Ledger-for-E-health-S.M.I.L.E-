import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomStatus } from '../../utils/enums/room-status.enum';
import { RoomType } from '../../utils/enums/room-type.enum';

export class QueryTreatmentRoomDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false, enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;

  @ApiProperty({ required: false, enum: RoomStatus })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: string;
}
