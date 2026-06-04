import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsUUID } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notificationType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}
