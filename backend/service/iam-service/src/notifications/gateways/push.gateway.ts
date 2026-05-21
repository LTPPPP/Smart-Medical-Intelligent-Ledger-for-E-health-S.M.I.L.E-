import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class PushGateway {
  private readonly logger = new Logger(PushGateway.name);

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    this.logger.log(`[STUB] Sending Push notification to recipient: ${dto.recipientId}`);
    this.logger.log(`[STUB] Subject: ${dto.subject}`);
    this.logger.log(`[STUB] Message: ${dto.message}`);
    this.logger.warn('PushGateway is not implemented - STUB MODE');

    return {
      id: `push_${Date.now()}`,
      status: 'sent',
    };
  }
}
