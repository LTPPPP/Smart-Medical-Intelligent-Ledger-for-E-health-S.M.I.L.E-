import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class InAppGateway {
  private readonly logger = new Logger(InAppGateway.name);

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    this.logger.log(`[STUB] Creating in-app notification for recipient: ${dto.recipientId}`);
    this.logger.log(`[STUB] Subject: ${dto.subject}`);
    this.logger.log(`[STUB] Message: ${dto.message}`);
    this.logger.warn('InAppGateway is not implemented - STUB MODE');

    return {
      id: `inapp_${Date.now()}`,
      status: 'created',
    };
  }
}
