import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsEnum } from 'class-validator';
import { NotificationChannel } from '../domain/notification-template';

// The owner is taken from the caller's token — deliberately not part of the
// request body, so nobody can set another account's preferences.
export class CreateNotificationPreferenceDto {
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
