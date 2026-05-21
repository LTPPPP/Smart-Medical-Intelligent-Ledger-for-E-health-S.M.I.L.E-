import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '@auth/mail/mail.service';
import { SendNotificationDto, SendNotificationResult } from './gateway.interface';

@Injectable()
export class EmailGateway {
  private readonly logger = new Logger(EmailGateway.name);

  constructor(private readonly mailService: MailService) {}

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    if (!dto.recipientEmail) {
      this.logger.warn(
        `No recipient email provided for notification to user: ${dto.recipientId}. Skipping email delivery.`,
      );
      return {
        id: `email_skipped_${Date.now()}`,
        status: 'skipped',
      };
    }

    try {
      await this.mailService.sendNotificationEmail({
        to: dto.recipientEmail,
        subject: dto.subject || 'S.M.I.L.E Notification',
        html: dto.message,
      });

      this.logger.log(`Email sent to ${dto.recipientEmail} for recipient: ${dto.recipientId}`);

      return {
        id: `email_${Date.now()}`,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${dto.recipientEmail}: ${error.message}`);
      throw error;
    }
  }
}
