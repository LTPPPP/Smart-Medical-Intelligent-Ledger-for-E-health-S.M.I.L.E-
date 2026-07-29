import { Injectable } from '@nestjs/common';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class PushGateway {
  async send(_dto: SendNotificationDto): Promise<SendNotificationResult> {
    return {
      id: `push_${Date.now()}`,
      status: 'skipped',
    };
  }
}
