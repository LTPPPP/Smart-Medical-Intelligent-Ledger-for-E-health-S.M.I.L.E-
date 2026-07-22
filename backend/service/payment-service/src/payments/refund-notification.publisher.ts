import { Injectable, Logger } from '@nestjs/common';

export type RefundNotificationType = 'REFUND_APPROVED' | 'REFUND_REJECTED';

// In-app notification for the patient when an admin reviews a refund request.
// Mirrors clinical-emr's appointment-notification.publisher.ts: IAM's
// POST /v1/notifications is unauthenticated, so a plain fetch with the DTO
// body is all that's needed. Unlike that publisher, this one never throws —
// a refund review must not fail because the notification hop is down.
@Injectable()
export class RefundNotificationPublisher {
  private readonly logger = new Logger(RefundNotificationPublisher.name);

  private readonly iamServiceUrl = (
    process.env.IAM_SERVICE_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');

  publish(params: {
    recipientId: string; // appointment.patient_id — same id space appointment notifications use
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
            `IAM rejected ${params.notificationType} notification for payment ${params.paymentId}: HTTP ${res.status}`,
          );
        }
      })
      .catch((err) =>
        this.logger.warn(
          `Failed to send ${params.notificationType} notification for payment ${params.paymentId}: ${err?.message}`,
        ),
      );
  }
}
