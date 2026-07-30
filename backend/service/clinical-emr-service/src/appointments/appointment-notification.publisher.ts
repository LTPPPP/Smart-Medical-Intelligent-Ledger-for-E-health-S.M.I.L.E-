import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppointmentEntity } from './entities/appointment.entity';
import { getSanitizedNotificationError } from './appointment-notification-error';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const { errorClass, errorCode } = getSanitizedNotificationError(error);
      this.logger.error(
        `operation=appointment_notification outcome=failed type=${payload.notificationType} error_class=${errorClass} error_code=${errorCode}`,
      );
      throw new ServiceUnavailableException({
        code: 'APPOINTMENT_NOTIFICATION_UNAVAILABLE',
        message: 'Unable to create appointment notification',
      });
    }

    if (!response.ok) {
      this.logger.warn(
        `operation=appointment_notification outcome=rejected type=${payload.notificationType} error_class=HttpError http_status=${response.status}`,
      );
      throw new ServiceUnavailableException({
        code: 'APPOINTMENT_NOTIFICATION_REJECTED',
        message: 'Appointment notification was rejected',
      });
    }

    let result: AppointmentNotificationDispatchResult;
    try {
      const parsed: unknown = await response.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw Object.assign(new Error('Invalid notification response shape'), {
          name: 'InvalidResponseError',
          code: 'INVALID_RESPONSE_SHAPE',
        });
      }
      result = parsed as AppointmentNotificationDispatchResult;
    } catch (error) {
      const { errorClass, errorCode } = getSanitizedNotificationError(error);
      this.logger.error(
        `operation=appointment_notification outcome=failed type=${payload.notificationType} error_class=${errorClass} error_code=${errorCode}`,
      );
      throw new ServiceUnavailableException({
        code: 'APPOINTMENT_NOTIFICATION_INVALID_RESPONSE',
        message: 'Appointment notification returned an invalid response',
      });
    }

    this.logger.log(
      `operation=appointment_notification outcome=sent type=${payload.notificationType}`,
    );

    return result;
  }
}
