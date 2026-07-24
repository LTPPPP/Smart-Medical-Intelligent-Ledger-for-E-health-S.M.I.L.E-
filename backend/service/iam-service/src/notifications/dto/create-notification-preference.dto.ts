import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { NotificationChannel } from '../domain/notification-template';

export class CreateNotificationPreferenceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notificationType: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}
