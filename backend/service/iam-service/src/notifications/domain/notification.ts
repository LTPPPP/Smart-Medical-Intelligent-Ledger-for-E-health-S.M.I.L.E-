import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus } from './notification-template';

export class Notification {
  @ApiProperty()
  notificationId: string;

  @ApiProperty()
  recipientId: string;

  @ApiProperty({ required: false })
  templateId?: string;

  @ApiProperty({ required: false })
  notificationType?: string;

  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty({ required: false })
  subject?: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  relatedEntityId?: string;

  @ApiProperty({ required: false })
  relatedEntityType?: string;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  readAt?: Date;

  @ApiProperty({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty()
  retryCount: number;

  @ApiProperty()
  maxRetries: number;

  @ApiProperty({ required: false })
  nextRetryAt?: Date;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
