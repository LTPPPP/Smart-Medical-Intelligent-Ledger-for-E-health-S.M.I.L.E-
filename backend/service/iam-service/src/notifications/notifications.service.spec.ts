import { NotificationsService } from './notifications.service';
import {
  NotificationChannel,
  NotificationStatus,
} from './domain/notification-template';

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
      send: jest.fn(() => Promise.resolve({ id: 'delivery-1' })),
    };

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
});
