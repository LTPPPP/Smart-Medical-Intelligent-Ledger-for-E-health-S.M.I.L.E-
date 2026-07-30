import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class EmailGateway {
  constructor(private readonly mailService: MailService) {}

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    if (!dto.recipientEmail) {
      return {
        id: `email_skipped_${Date.now()}`,
        status: 'skipped',
      };
    }

    await this.mailService.sendNotificationEmail({
      to: dto.recipientEmail,
      subject: dto.subject || 'S.M.I.L.E Notification',
      html: dto.message,
    });

    return {
      id: `email_${Date.now()}`,
      status: 'sent',
    };
  }
}
