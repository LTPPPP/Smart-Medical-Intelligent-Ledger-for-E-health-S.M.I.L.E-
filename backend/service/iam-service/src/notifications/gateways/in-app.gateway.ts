import { Injectable } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class InAppGateway {
  async send(_dto: SendNotificationDto): Promise<SendNotificationResult> {
    return {
      id: `inapp_${Date.now()}`,
      status: 'created',
    };
  }
}
