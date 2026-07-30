import { NotificationsService } from './notifications.service';
import { NotificationChannel, NotificationStatus } from './domain/notification-template';
import { Logger } from '@nestjs/common';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => value),
    save: jest.fn((value) =>
      Promise.resolve({
        ...value,
        notificationId: value.notificationId ?? 'n0000000-0000-0000-0000-000000000001',
        createdAt: value.createdAt ?? new Date('2026-06-01T01:00:00.000Z'),
        updatedAt: value.updatedAt ?? new Date('2026-06-01T01:00:00.000Z'),
      }),
    ),
    findOne: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

describe('NotificationsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create and dispatch appointment notifications with related entity metadata', async () => {
    const notificationRepository = createRepositoryMock();
    const templateRepository = createRepositoryMock();
    const deliveryLogRepository = createRepositoryMock();
    const preferenceRepository = createRepositoryMock();
    const handlebarsService = { compile: jest.fn() };
    const emailGateway = { send: jest.fn() };
    const smsGateway = { send: jest.fn() };
    const pushGateway = { send: jest.fn() };
    const inAppGateway = {
      send: jest.fn(() => Promise.resolve({ id: 'delivery-1', status: 'created' })),
    };
    const accountsService = { findById: jest.fn() };

    const service = new NotificationsService(
      notificationRepository as any,
      templateRepository as any,
      deliveryLogRepository as any,
      preferenceRepository as any,
      handlebarsService as any,
      emailGateway as any,
      smsGateway as any,
      pushGateway as any,
      inAppGateway as any,
      accountsService as any,
    );

    const result = await service.createNotification({
      recipientId: '10000000-0000-0000-0000-000000000001',
      notificationType: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.APP,
      subject: 'Appointment confirmation',
      message: 'Your appointment is confirmed.',
      relatedEntityId: 'a0000000-0000-0000-0000-000000000001',
      relatedEntityType: 'appointment',
    });

    expect(notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'APPOINTMENT_CONFIRMATION',
        relatedEntityId: 'a0000000-0000-0000-0000-000000000001',
        relatedEntityType: 'appointment',
        status: NotificationStatus.PENDING,
      }),
    );
    expect(inAppGateway.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: '10000000-0000-0000-0000-000000000001',
        subject: 'Appointment confirmation',
      }),
    );
    expect(result.relatedEntityType).toBe('appointment');
  });

  it('resolves the recipient email before recording a successful delivery', async () => {
    const notificationRepository = createRepositoryMock();
    const deliveryLogRepository = createRepositoryMock();
    const emailGateway = {
      send: jest.fn().mockResolvedValue({
        id: 'email-delivery-1',
        status: 'sent',
      }),
    };
    const accountsService = {
      findById: jest.fn().mockResolvedValue({
        email: 'doctor@smile.test',
      }),
    };
    const service = new NotificationsService(
      notificationRepository as any,
      createRepositoryMock() as any,
      deliveryLogRepository as any,
      createRepositoryMock() as any,
      { compile: jest.fn() } as any,
      emailGateway as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      accountsService as any,
    );

    await service.createNotification({
      recipientId: '10000000-0000-0000-0000-000000000001',
      notificationType: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.EMAIL,
      subject: 'Appointment confirmation',
      message: 'Your appointment is confirmed.',
    });

    expect(accountsService.findById).toHaveBeenCalledWith('10000000-0000-0000-0000-000000000001');
    expect(emailGateway.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'doctor@smile.test',
      }),
    );
    expect(notificationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: NotificationStatus.SENT,
        sentAt: expect.any(Date),
      }),
    );
    expect(deliveryLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayName: 'EmailGateway',
        status: 'success',
      }),
    );
  });

  it('keeps email pending when the canonical account has no address', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const notificationRepository = createRepositoryMock();
    const deliveryLogRepository = createRepositoryMock();
    const emailGateway = {
      send: jest.fn().mockResolvedValue({
        id: 'email-skipped-1',
        status: 'skipped',
      }),
    };
    const accountsService = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const service = new NotificationsService(
      notificationRepository as any,
      createRepositoryMock() as any,
      deliveryLogRepository as any,
      createRepositoryMock() as any,
      { compile: jest.fn() } as any,
      emailGateway as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      accountsService as any,
    );

    await service.createNotification({
      recipientId: '10000000-0000-0000-0000-000000000001',
      notificationType: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.EMAIL,
      subject: 'Appointment confirmation',
      message: 'Your appointment is confirmed.',
    });

    expect(emailGateway.send).toHaveBeenCalledWith(
      expect.not.objectContaining({
        recipientEmail: expect.any(String),
      }),
    );
    expect(notificationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: NotificationStatus.PENDING,
        retryCount: 1,
        errorMessage: 'error_class=DeliverySkippedError error_code=DELIVERY_SKIPPED',
      }),
    );
    expect(deliveryLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayName: 'EmailGateway',
        status: 'failed',
      }),
    );
  });

  it.each([
    ['SMS', NotificationChannel.SMS],
    ['push', NotificationChannel.PUSH],
  ])('keeps a skipped %s notification pending instead of claiming delivery', async (_channelName, channel) => {
    const loggerWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const notificationRepository = createRepositoryMock();
    const deliveryLogRepository = createRepositoryMock();
    const smsGateway = {
      send: jest.fn().mockResolvedValue({
        id: 'sms-skipped-1',
        status: 'skipped',
      }),
    };
    const pushGateway = {
      send: jest.fn().mockResolvedValue({
        id: 'push-skipped-1',
        status: 'skipped',
      }),
    };
    const service = new NotificationsService(
      notificationRepository as any,
      createRepositoryMock() as any,
      deliveryLogRepository as any,
      createRepositoryMock() as any,
      { compile: jest.fn() } as any,
      { send: jest.fn() } as any,
      smsGateway as any,
      pushGateway as any,
      { send: jest.fn() } as any,
      { findById: jest.fn() } as any,
    );

    await service.createNotification({
      recipientId: '10000000-0000-0000-0000-000000000001',
      notificationType: 'APPOINTMENT_CONFIRMATION',
      channel,
      subject: 'Appointment confirmation',
      message: 'Your appointment is confirmed.',
    });

    expect(notificationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: NotificationStatus.PENDING,
        retryCount: 1,
        errorMessage: 'error_class=DeliverySkippedError error_code=DELIVERY_SKIPPED',
        nextRetryAt: expect.any(Date),
      }),
    );
    expect(deliveryLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorPayload: {
          errorClass: 'DeliverySkippedError',
          errorCode: 'DELIVERY_SKIPPED',
        },
      }),
    );
    expect(loggerWarn).toHaveBeenCalledWith(
      'operation=notification_dispatch outcome=failed error_class=DeliverySkippedError error_code=DELIVERY_SKIPPED',
    );
  });

  it('owns dispatch failure logging without emitting the raw gateway error', async () => {
    const notificationRepository = createRepositoryMock();
    const deliveryLogRepository = createRepositoryMock();
    const rawError = 'sentinel-gateway-error-with-private-data';
    const gatewayError = Object.assign(new Error(rawError), {
      name: 'TransportError',
      code: 'ECONNRESET',
    });
    const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const service = new NotificationsService(
      notificationRepository as any,
      createRepositoryMock() as any,
      deliveryLogRepository as any,
      createRepositoryMock() as any,
      { compile: jest.fn() } as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      { send: jest.fn().mockRejectedValue(gatewayError) } as any,
      { findById: jest.fn() } as any,
    );

    await service.createNotification({
      recipientId: 'sentinel-recipient-id',
      notificationType: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.APP,
      subject: 'sentinel-private-subject',
      message: 'sentinel-private-message',
    });

    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain('sentinel-recipient-id');
    expect(notificationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        errorMessage: 'error_class=TransportError error_code=ECONNRESET',
      }),
    );
    expect(deliveryLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        errorPayload: {
          errorClass: 'TransportError',
          errorCode: 'ECONNRESET',
        },
      }),
    );
    expect(
      JSON.stringify([notificationRepository.save.mock.calls, deliveryLogRepository.create.mock.calls]),
    ).not.toContain(rawError);
  });
});
