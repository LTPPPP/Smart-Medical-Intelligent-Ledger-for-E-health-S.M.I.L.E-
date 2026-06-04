import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class SmsGateway {
  private readonly logger = new Logger(SmsGateway.name);

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    this.logger.log(`[STUB] Sending SMS to recipient: ${dto.recipientId}`);
    this.logger.log(`[STUB] Message: ${dto.message}`);
    this.logger.warn('SmsGateway is not implemented - STUB MODE');

    return {
      id: `sms_${Date.now()}`,
      status: 'sent',
    };
  }
}
