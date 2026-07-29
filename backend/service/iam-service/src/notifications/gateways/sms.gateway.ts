import { Injectable } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class SmsGateway {
  async send(_dto: SendNotificationDto): Promise<SendNotificationResult> {
    return {
      id: `sms_${Date.now()}`,
      status: 'skipped',
    };
  }
}
