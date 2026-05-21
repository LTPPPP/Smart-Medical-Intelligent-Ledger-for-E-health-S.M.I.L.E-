import { ApiProperty } from '@nestjs/swagger';

export class NotificationDeliveryLog {
  @ApiProperty()
  logId: string;

  @ApiProperty()
  notificationId: string;

  @ApiProperty({ required: false })
  gatewayName?: string;

  @ApiProperty({ required: false })
  gatewayResponseId?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  errorPayload?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}
