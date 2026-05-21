import { ApiProperty } from '@nestjs/swagger';

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  APP = 'APP',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
  CANCELLED = 'cancelled',
}

export class NotificationTemplate {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  templateCode: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  subjectTemplate?: string;

  @ApiProperty()
  bodyTemplate: string;

  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
