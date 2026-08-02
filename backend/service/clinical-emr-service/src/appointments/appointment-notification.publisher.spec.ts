import {
  AppointmentNotificationPayload,
  AppointmentNotificationPublisher,
} from './appointment-notification.publisher';
import { NotificationChannel } from '../utils/enums/notification-channel.enum';

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
      json: jest.fn().mockResolvedValue({
        notificationId: 'notification-sentinel-99999999',
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const publisher = new AppointmentNotificationPublisher();
    const logSpy = jest
      .spyOn((publisher as any).logger, 'log')
      .mockImplementation();

    await expect(publisher.sendAppointmentReminder(payload)).resolves.toEqual(
      expect.objectContaining({
        notificationId: 'notification-sentinel-99999999',
      }),
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
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      'operation=appointment_notification outcome=sent type=APPOINTMENT_REMINDER',
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      payload.appointmentId,
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      'notification-sentinel-99999999',
    );
  });

  it('should forward an explicit reminder channel to IAM', async () => {
    process.env.IAM_SERVICE_URL = 'http://iam.local';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ notificationId: 'n-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const publisher = new AppointmentNotificationPublisher();
    jest.spyOn((publisher as any).logger, 'log').mockImplementation();

    await publisher.sendAppointmentReminder(payload, NotificationChannel.EMAIL);

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(requestInit.body).channel).toBe('EMAIL');
  });

  it('should sanitize IAM rejection diagnostics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch;
    const publisher = new AppointmentNotificationPublisher();
    const warnSpy = jest
      .spyOn((publisher as any).logger, 'warn')
      .mockImplementation();

    await expect(
      publisher.sendAppointmentReminder({
        ...payload,
        appointmentId: 'a9999999-9999-9999-9999-999999999999',
      }),
    ).rejects.toMatchObject({
      response: { code: 'APPOINTMENT_NOTIFICATION_REJECTED' },
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=appointment_notification outcome=rejected type=APPOINTMENT_REMINDER error_class=HttpError http_status=503',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'a9999999-9999-9999-9999-999999999999',
    );
  });

  it('should log only a sanitized error class when IAM is unavailable', async () => {
    const sentinelMessage =
      'SENTINEL_RAW_APPOINTMENT_ERROR a9999999-9999-9999-9999-999999999999';
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new TypeError(sentinelMessage),
      ) as unknown as typeof fetch;
    const publisher = new AppointmentNotificationPublisher();
    const errorSpy = jest
      .spyOn((publisher as any).logger, 'error')
      .mockImplementation();

    await expect(
      publisher.sendAppointmentReminder({
        ...payload,
        appointmentId: 'a9999999-9999-9999-9999-999999999999',
        relatedEntityId: 'a9999999-9999-9999-9999-999999999999',
      }),
    ).rejects.toMatchObject({
      response: { code: 'APPOINTMENT_NOTIFICATION_UNAVAILABLE' },
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      'operation=appointment_notification outcome=failed type=APPOINTMENT_REMINDER error_class=TypeError error_code=unknown',
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(sentinelMessage);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      'a9999999-9999-9999-9999-999999999999',
    );
  });

  it('should not log sent when the IAM response body cannot be parsed', async () => {
    const rawError = 'SENTINEL_INVALID_IAM_BODY recipient-private@example.test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new SyntaxError(rawError)),
    }) as unknown as typeof fetch;
    const publisher = new AppointmentNotificationPublisher();
    const logSpy = jest
      .spyOn((publisher as any).logger, 'log')
      .mockImplementation();
    const errorSpy = jest
      .spyOn((publisher as any).logger, 'error')
      .mockImplementation();

    await expect(
      publisher.sendAppointmentReminder(payload),
    ).rejects.toMatchObject({
      response: { code: 'APPOINTMENT_NOTIFICATION_INVALID_RESPONSE' },
    });

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      'operation=appointment_notification outcome=failed type=APPOINTMENT_REMINDER error_class=SyntaxError error_code=unknown',
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(rawError);
  });
});
