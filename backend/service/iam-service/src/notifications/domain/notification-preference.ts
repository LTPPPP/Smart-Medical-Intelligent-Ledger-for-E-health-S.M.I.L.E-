import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from './notification-template';

export class NotificationPreference {
  @ApiProperty()
  preferenceId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  notificationType: string;

  @ApiProperty()
  channel: NotificationChannel;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
