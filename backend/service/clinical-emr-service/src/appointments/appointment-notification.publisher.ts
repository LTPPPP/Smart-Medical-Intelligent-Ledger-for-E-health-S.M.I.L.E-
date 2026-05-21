import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AppointmentNotificationPublisher {
  private readonly logger = new Logger(AppointmentNotificationPublisher.name);

  sendAppointmentConfirmation(
    payload: AppointmentNotificationPayload,
  ): Promise<AppointmentNotificationPayload> {
    this.logNotificationPayload(payload);
    return Promise.resolve(payload);
  }

  sendAppointmentReminder(
    payload: AppointmentNotificationPayload,
  ): Promise<AppointmentNotificationPayload> {
    this.logNotificationPayload(payload);
    return Promise.resolve(payload);
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

  private logNotificationPayload(
    payload: AppointmentNotificationPayload,
  ): void {
    this.logger.log(
      `Prepared ${payload.notificationType} notification for appointment ${payload.appointmentId}`,
    );
  }
}
