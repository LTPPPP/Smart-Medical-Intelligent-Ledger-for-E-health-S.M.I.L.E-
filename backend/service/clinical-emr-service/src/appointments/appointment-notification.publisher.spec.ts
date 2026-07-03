import {
  AppointmentNotificationPayload,
  AppointmentNotificationPublisher,
} from './appointment-notification.publisher';

const payload: AppointmentNotificationPayload = {
  appointmentId: 'a0000000-0000-0000-0000-000000000001',
  appointmentCode: 'APT-20260703-ABCD',
  recipientId: 'p0000000-0000-0000-0000-000000000001',
  notificationType: 'APPOINTMENT_REMINDER',
  relatedEntityType: 'appointment',
  relatedEntityId: 'a0000000-0000-0000-0000-000000000001',
  appointmentDate: '2026-07-03',
  appointmentTime: '09:00',
  title: 'Appointment reminder',
  message:
    'Reminder: appointment APT-20260703-ABCD is scheduled for 2026-07-03 at 09:00.',
};

describe('AppointmentNotificationPublisher', () => {
  const originalFetch = global.fetch;
  const originalIamServiceUrl = process.env.IAM_SERVICE_URL;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalIamServiceUrl === undefined) {
      delete process.env.IAM_SERVICE_URL;
    } else {
      process.env.IAM_SERVICE_URL = originalIamServiceUrl;
    }
    jest.restoreAllMocks();
  });

  it('should create an IAM in-app notification for appointment reminders', async () => {
    process.env.IAM_SERVICE_URL = 'http://iam.local/';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ notificationId: 'notification-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const publisher = new AppointmentNotificationPublisher();

    await expect(publisher.sendAppointmentReminder(payload)).resolves.toEqual(
      expect.objectContaining({ notificationId: 'notification-1' }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://iam.local/v1/notifications',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: payload.recipientId,
          notificationType: payload.notificationType,
          channel: 'APP',
          subject: payload.title,
          message: payload.message,
          relatedEntityId: payload.relatedEntityId,
          relatedEntityType: payload.relatedEntityType,
        }),
      }),
    );
  });
});
