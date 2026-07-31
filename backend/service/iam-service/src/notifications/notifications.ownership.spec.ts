import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationChannel } from './domain/notification-template';

const owner = { accountId: 'owner-account', role: 'PATIENT' };
const attacker = { accountId: 'attacker-account', role: 'PATIENT' };
const admin = { accountId: 'admin-account', role: 'ADMIN' };

const notificationId = 'n0000000-0000-0000-0000-000000000001';
const preferenceId = 'p0000000-0000-0000-0000-000000000001';

function createService() {
  const notificationRepository = {
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(3),
    createQueryBuilder: jest.fn(),
  };
  const preferenceRepository = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ preferenceId, ...value })),
    delete: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue([]),
    findOneByUserIdAndTypeAndChannel: jest.fn().mockResolvedValue(null),
  };
  const noop = { send: jest.fn(), compile: jest.fn(), findById: jest.fn() };

  const service = new NotificationsService(
    notificationRepository as any,
    { findOne: jest.fn() } as any,
    { save: jest.fn() } as any,
    preferenceRepository as any,
    noop as any,
    noop as any,
    noop as any,
    noop as any,
    noop as any,
    noop as any,
  );

  return { service, notificationRepository, preferenceRepository };
}

function queryBuilderMock() {
  const qb: any = {
    andWhere: jest.fn(() => qb),
    orderBy: jest.fn(() => qb),
    skip: jest.fn(() => qb),
    take: jest.fn(() => qb),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
}

describe('notification ownership', () => {
  describe('single notification access', () => {
    it.each([
      ['read', (s: NotificationsService, a: any) => s.findNotificationById(notificationId, a)],
      [
        'update',
        (s: NotificationsService, a: any) =>
          s.updateNotification(notificationId, { subject: 'x' } as any, a),
      ],
      ['delete', (s: NotificationsService, a: any) => s.deleteNotification(notificationId, a)],
      ['mark read', (s: NotificationsService, a: any) => s.markAsRead(notificationId, a)],
    ])("refuses to %s another user's notification", async (_label, call) => {
      const { service, notificationRepository } = createService();
      notificationRepository.findOne.mockResolvedValue({
        notificationId,
        recipientId: owner.accountId,
      });

      await expect(call(service, attacker)).rejects.toThrow(NotFoundException);
      expect(notificationRepository.delete).not.toHaveBeenCalled();
      expect(notificationRepository.save).not.toHaveBeenCalled();
    });

    it('lets the recipient mark their own notification read', async () => {
      const { service, notificationRepository } = createService();
      notificationRepository.findOne.mockResolvedValue({
        notificationId,
        recipientId: owner.accountId,
      });

      await expect(service.markAsRead(notificationId, owner)).resolves.toBeUndefined();
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('lets an admin read any notification', async () => {
      const { service, notificationRepository } = createService();
      notificationRepository.findOne.mockResolvedValue({
        notificationId,
        recipientId: owner.accountId,
        channel: NotificationChannel.APP,
      });

      await expect(
        service.findNotificationById(notificationId, admin),
      ).resolves.toMatchObject({ notificationId });
    });
  });

  describe('listing', () => {
    it('forces a non-admin list to the caller regardless of the requested recipient', async () => {
      const { service, notificationRepository } = createService();
      const qb = queryBuilderMock();
      notificationRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findNotificationsWithPagination(
        { page: 1, limit: 10 },
        attacker,
        { recipientId: owner.accountId },
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'notification.recipient_id = :recipientId',
        { recipientId: attacker.accountId },
      );
    });

    it('ignores sort fields that are not on the allow-list', async () => {
      const { service, notificationRepository } = createService();
      const qb = queryBuilderMock();
      notificationRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findNotificationsWithPagination(
        { page: 1, limit: 10 },
        owner,
        undefined,
        [{ field: 'recipientId); DROP TABLE notifications;--', order: 'ASC' }],
      );

      expect(qb.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
    });
  });

  describe('unread count and preferences', () => {
    it("refuses another user's unread count", async () => {
      const { service } = createService();

      await expect(
        service.getUnreadCount(owner.accountId, attacker),
      ).rejects.toThrow(ForbiddenException);
    });

    it("refuses to read another user's preferences", async () => {
      const { service } = createService();

      await expect(
        service.findPreferencesByUserId(owner.accountId, attacker),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates preferences for the caller, not a body-supplied user', async () => {
      const { service, preferenceRepository } = createService();

      await service.createPreference(
        {
          userId: owner.accountId,
          notificationType: 'APPOINTMENT_CONFIRMATION',
          channel: NotificationChannel.APP,
          isEnabled: true,
        } as any,
        attacker,
      );

      expect(preferenceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: attacker.accountId }),
      );
    });

    it("refuses to mutate another user's preference", async () => {
      const { service, preferenceRepository } = createService();
      preferenceRepository.findOne.mockResolvedValue({
        preferenceId,
        userId: owner.accountId,
      });

      await expect(
        service.updatePreference(preferenceId, { isEnabled: false } as any, attacker),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deletePreference(preferenceId, attacker),
      ).rejects.toThrow(NotFoundException);
      expect(preferenceRepository.delete).not.toHaveBeenCalled();
    });
  });
});
