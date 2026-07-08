import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppointmentEntity } from './entities/appointment.entity';

export type AppointmentNotificationType =
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_REMINDER';

export interface AppointmentNotificationPayload {
  appointmentId: string;
  appointmentCode: string;
  recipientId: string;
  notificationType: AppointmentNotificationType;
  relatedEntityType: 'appointment';
  relatedEntityId: string;
  appointmentDate: string;
  appointmentTime: string;
  title: string;
  message: string;
}

export interface AppointmentNotificationDispatchResult {
  notificationId?: string;
  recipientId?: string;
  notificationType?: string;
  channel?: string;
  subject?: string;
  message?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  status?: string;
}

@Injectable()
export class AppointmentNotificationPublisher {
  private readonly logger = new Logger(AppointmentNotificationPublisher.name);
  private readonly iamServiceUrl = (
    process.env.IAM_SERVICE_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');

  sendAppointmentConfirmation(
    payload: AppointmentNotificationPayload,
  ): Promise<AppointmentNotificationDispatchResult> {
    return this.sendNotification(payload);
  }

  sendAppointmentReminder(
    payload: AppointmentNotificationPayload,
  ): Promise<AppointmentNotificationDispatchResult> {
    return this.sendNotification(payload);
  }

  buildPayload(
    appointment: AppointmentEntity,
    notificationType: AppointmentNotificationType,
  ): AppointmentNotificationPayload {
    const appointmentDate = this.formatAppointmentDate(
      appointment.appointment_date,
    );
    const isConfirmation = notificationType === 'APPOINTMENT_CONFIRMATION';

    return {
      appointmentId: appointment.appointment_id,
      appointmentCode: appointment.appointment_code,
      recipientId: appointment.patient_id,
      notificationType,
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.appointment_id,
      appointmentDate,
      appointmentTime: appointment.appointment_time,
      title: isConfirmation
        ? 'Appointment confirmation'
        : 'Appointment reminder',
      message: isConfirmation
        ? `Your appointment ${appointment.appointment_code} is confirmed for ${appointmentDate} at ${appointment.appointment_time}.`
        : `Reminder: appointment ${appointment.appointment_code} is scheduled for ${appointmentDate} at ${appointment.appointment_time}.`,
    };
  }

  private formatAppointmentDate(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    return value;
  }

  private async sendNotification(
    payload: AppointmentNotificationPayload,
  ): Promise<AppointmentNotificationDispatchResult> {
    const body = {
      recipientId: payload.recipientId,
      notificationType: payload.notificationType,
      channel: 'APP',
      subject: payload.title,
      message: payload.message,
      relatedEntityId: payload.relatedEntityId,
      relatedEntityType: payload.relatedEntityType,
    };

    let response: Response;
    try {
      response = await fetch(`${this.iamServiceUrl}/v1/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key':
            process.env.IAM_INTERNAL_API_KEY || 'smile-internal-dev-key',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error(
        `Unable to create ${payload.notificationType} notification for appointment ${payload.appointmentId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException({
        code: 'APPOINTMENT_NOTIFICATION_UNAVAILABLE',
        message: 'Unable to create appointment notification',
      });
    }

    if (!response.ok) {
      this.logger.warn(
        `IAM rejected ${payload.notificationType} notification for appointment ${payload.appointmentId} with status ${response.status}`,
      );
      throw new ServiceUnavailableException({
        code: 'APPOINTMENT_NOTIFICATION_REJECTED',
        message: 'Appointment notification was rejected',
      });
    }

    this.logger.log(
      `Created ${payload.notificationType} notification for appointment ${payload.appointmentId}`,
    );

    return (await response.json()) as AppointmentNotificationDispatchResult;
  }
}
