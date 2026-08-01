import { Injectable, Logger } from '@nestjs/common';
import { getSanitizedErrorMetadata } from './payment-error-metadata';

export type RefundNotificationType = 'REFUND_APPROVED' | 'REFUND_REJECTED';

// Refund Notification Publisher
@Injectable()
export class RefundNotificationPublisher {
  private readonly logger = new Logger(RefundNotificationPublisher.name);

  private readonly iamServiceUrl = (
    process.env.IAM_SERVICE_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');

  publish(params: {
    recipientId: string; // Same Id Space
    notificationType: RefundNotificationType;
    paymentId: string;
    subject: string;
    message: string;
  }): void {
    fetch(`${this.iamServiceUrl}/v1/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: params.recipientId,
        notificationType: params.notificationType,
        channel: 'APP',
        subject: params.subject,
        message: params.message,
        relatedEntityId: params.paymentId,
        relatedEntityType: 'payment',
      }),
    })
      .then((res) => {
        if (!res.ok) {
          this.logger.warn(
            `operation=refund_notification outcome=rejected type=${params.notificationType} error_class=HttpError http_status=${res.status}`,
          );
          return;
        }
        this.logger.log(
          `operation=refund_notification outcome=sent type=${params.notificationType}`,
        );
      })
      .catch((error: unknown) => {
        const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
        this.logger.warn(
          `operation=refund_notification outcome=failed type=${params.notificationType} error_class=${errorClass} error_code=${errorCode}`,
        );
      });
  }
}
