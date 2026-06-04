import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreference {
  @ApiProperty()
  preferenceId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  notificationType: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
