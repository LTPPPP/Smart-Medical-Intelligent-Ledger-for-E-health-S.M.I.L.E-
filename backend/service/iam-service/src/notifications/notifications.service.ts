import { Injectable, Logger } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { HandlebarsService } from './handlebars.service';
import { NotificationTemplateRepository } from './infrastructure/persistence/relational/repositories/notification-template.repository';
import { NotificationPreferenceRepository } from './infrastructure/persistence/relational/repositories/notification-preference.repository';
import { NotificationRepository } from './infrastructure/persistence/relational/repositories/notification.repository';
import { NotificationDeliveryLogRepository } from './infrastructure/persistence/relational/repositories/notification-delivery-log.repository';
import { NotificationTemplateEntity } from './infrastructure/persistence/relational/entities/notification-template.entity';
import { NotificationEntity } from './infrastructure/persistence/relational/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { Notification } from './domain/notification';
import { NotificationTemplate } from './domain/notification-template';
import { NotificationPreference } from './domain/notification-preference';
import { NotificationChannel, NotificationStatus } from './domain/notification-template';
import { NullableType } from '@auth/utils/types/nullable.type';
import { IPaginationOptions } from '@auth/utils/types/pagination-options';
import { EmailGateway } from './gateways/email.gateway';
import { SmsGateway } from './gateways/sms.gateway';
import { PushGateway } from './gateways/push.gateway';
import { InAppGateway } from './gateways/in-app.gateway';
import { SendNotificationDto, SendNotificationResult } from './gateways/gateway.interface';
import { getSanitizedErrorMetadata } from '../common/error-metadata';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private notificationRepository: NotificationRepository,
    private templateRepository: NotificationTemplateRepository,
    private deliveryLogRepository: NotificationDeliveryLogRepository,
    private notificationPreferenceRepository: NotificationPreferenceRepository,
    private handlebarsService: HandlebarsService,
    private emailGateway: EmailGateway,
    private smsGateway: SmsGateway,
    private pushGateway: PushGateway,
    private inAppGateway: InAppGateway,
    private accountsService: AccountsService,
  ) {}

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    let template: NotificationTemplateEntity | null = null;
    let subject = createDto.subject;
    let message = createDto.message;

    if (createDto.templateId) {
      template = await this.templateRepository.findOne({
        where: { templateId: createDto.templateId },
      });

      if (template) {
        const variables = {
          ...createDto,
          recipientId: createDto.recipientId,
          relatedEntityId: createDto.relatedEntityId,
        };

        if (template.subjectTemplate) {
          subject = this.handlebarsService.compile(template.subjectTemplate, variables);
        }
        message = this.handlebarsService.compile(template.bodyTemplate, variables);
      }
    }

    const notification = this.notificationRepository.create({
      recipientId: createDto.recipientId,
      templateId: createDto.templateId,
      ...(template ? { template } : {}),
      notificationType: createDto.notificationType,
      channel: createDto.channel,
      subject,
      message,
      relatedEntityId: createDto.relatedEntityId,
      relatedEntityType: createDto.relatedEntityType,
      scheduledAt: createDto.scheduledAt ? new Date(createDto.scheduledAt) : new Date(),
      status: NotificationStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
    });

    const saved = await this.notificationRepository.save(notification);

    // Dispatch synchronously via the appropriate gateway
    await this.dispatchNotification(saved);

    return this.toNotificationDomain(saved);
  }

  private async dispatchNotification(notification: NotificationEntity): Promise<void> {
    const sendDto: SendNotificationDto = {
      recipientId: notification.recipientId,
      subject: notification.subject,
      message: notification.message,
    };

    let result: SendNotificationResult;
    let gatewayName: string;

    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          gatewayName = 'EmailGateway';
          sendDto.recipientEmail = (await this.accountsService.findById(notification.recipientId))?.email ?? undefined;
          result = await this.emailGateway.send(sendDto);
          break;
        case NotificationChannel.SMS: {
          gatewayName = 'SmsGateway';
          // Only deliver to verified phone numbers.
          const account = await this.accountsService.findById(notification.recipientId);
          sendDto.recipientPhone = account?.phoneVerified ? (account.phone ?? undefined) : undefined;
          result = await this.smsGateway.send(sendDto);
          break;
        }
        case NotificationChannel.PUSH:
          gatewayName = 'PushGateway';
          result = await this.pushGateway.send(sendDto);
          break;
        case NotificationChannel.APP:
          gatewayName = 'InAppGateway';
          result = await this.inAppGateway.send(sendDto);
          break;
        default:
          this.logger.warn(
            `operation=notification_dispatch outcome=skipped reason=unknown_channel channel=${notification.channel}`,
          );
          return;
      }

      if (result.status === 'skipped') {
        throw Object.assign(new Error('Notification delivery was skipped'), {
          name: 'DeliverySkippedError',
          code: 'DELIVERY_SKIPPED',
        });
      }

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      // Log delivery
      await this.deliveryLogRepository.save(
        this.deliveryLogRepository.create({
          notificationId: notification.notificationId,
          gatewayName,
          gatewayResponseId: result.id,
          status: 'success',
        }),
      );
    } catch (error) {
      const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
      const logMessage = `operation=notification_dispatch outcome=failed error_class=${errorClass} error_code=${errorCode}`;
      if (errorClass === 'DeliverySkippedError') {
        this.logger.warn(logMessage);
      } else {
        this.logger.error(logMessage);
      }

      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = `error_class=${errorClass} error_code=${errorCode}`;
      notification.retryCount = (notification.retryCount || 0) + 1;

      if (notification.retryCount < notification.maxRetries) {
        notification.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min backoff
        notification.status = NotificationStatus.PENDING;
      }

      await this.notificationRepository.save(notification);

      // Log failed delivery
      await this.deliveryLogRepository.save(
        this.deliveryLogRepository.create({
          notificationId: notification.notificationId,
          gatewayName: gatewayName!,
          status: 'failed',
          errorPayload: {
            errorClass,
            errorCode,
          },
        }),
      );
    }
  }

  async findNotificationById(id: string): Promise<NullableType<Notification>> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id },
      relations: ['template'],
    });
    return notification ? this.toNotificationDomain(notification) : null;
  }

  async findNotificationsWithPagination(
    paginationOptions: IPaginationOptions,
    filters?: any,
    sortOptions?: any[],
  ): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification');

    if (filters?.recipientId) {
      query.andWhere('notification.recipient_id = :recipientId', {
        recipientId: filters.recipientId,
      });
    }

    if (filters?.channel) {
      query.andWhere('notification.channel = :channel', {
        channel: filters.channel,
      });
    }

    if (filters?.status) {
      query.andWhere('notification.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.notificationType) {
      query.andWhere('notification.notification_type = :notificationType', {
        notificationType: filters.notificationType,
      });
    }

    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        query.orderBy(`notification.${sort.field || 'createdAt'}`, sort.order || 'DESC');
      });
    } else {
      query.orderBy('notification.createdAt', 'DESC');
    }

    query.skip((paginationOptions.page - 1) * paginationOptions.limit);
    query.take(paginationOptions.limit);

    const notifications = await query.getMany();
    return notifications.map((n) => this.toNotificationDomain(n));
  }

  async updateNotification(id: string, updateDto: UpdateNotificationDto): Promise<NullableType<Notification>> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id },
    });

    if (!notification) {
      return null;
    }

    if (updateDto.subject !== undefined) {
      notification.subject = updateDto.subject;
    }

    if (updateDto.message !== undefined) {
      notification.message = updateDto.message;
    }

    if (updateDto.status !== undefined) {
      notification.status = updateDto.status;
      if (updateDto.status === NotificationStatus.SENT) {
        notification.sentAt = new Date();
      }
    }

    if (updateDto.read !== undefined && updateDto.read) {
      notification.readAt = new Date();
      notification.status = NotificationStatus.READ;
    }

    if (updateDto.retryCount !== undefined) {
      notification.retryCount = updateDto.retryCount;
    }

    if (updateDto.nextRetryAt !== undefined) {
      notification.nextRetryAt = new Date(updateDto.nextRetryAt);
    }

    const saved = await this.notificationRepository.save(notification);
    return this.toNotificationDomain(saved);
  }

  async deleteNotification(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  // ── Template CRUD ──────────────────────────────────────────────

  async createTemplate(createDto: CreateNotificationTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      templateCode: createDto.templateCode,
      name: createDto.name,
      description: createDto.description,
      subjectTemplate: createDto.subjectTemplate,
      bodyTemplate: createDto.bodyTemplate,
      channel: createDto.channel,
      isActive: createDto.isActive ?? true,
    });

    const saved = await this.templateRepository.save(template);
    return this.toTemplateDomain(saved);
  }

  async findTemplateById(id: string): Promise<NullableType<NotificationTemplate>> {
    const template = await this.templateRepository.findOne({
      where: { templateId: id },
    });
    return template ? this.toTemplateDomain(template) : null;
  }

  async findTemplateByCode(code: string): Promise<NullableType<NotificationTemplate>> {
    const template = await this.templateRepository.findOne({
      where: { templateCode: code, isActive: true },
    });
    return template ? this.toTemplateDomain(template) : null;
  }

  async findAllTemplates(): Promise<NotificationTemplate[]> {
    const templates = await this.templateRepository.find();
    return templates.map((t) => this.toTemplateDomain(t));
  }

  async updateTemplate(
    id: string,
    updateDto: UpdateNotificationTemplateDto,
  ): Promise<NullableType<NotificationTemplate>> {
    const template = await this.templateRepository.findOne({
      where: { templateId: id },
    });

    if (!template) {
      return null;
    }

    Object.assign(template, updateDto);
    const saved = await this.templateRepository.save(template);
    return this.toTemplateDomain(saved);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.delete(id);
  }

  // ── Preference CRUD ────────────────────────────────────────────

  async createPreference(createDto: CreateNotificationPreferenceDto): Promise<NotificationPreference> {
    const existing = await this.notificationPreferenceRepository.findOneByUserIdAndTypeAndChannel(
      createDto.userId,
      createDto.notificationType,
      createDto.channel,
    );

    if (existing) {
      existing.isEnabled = createDto.isEnabled;
      const saved = await this.notificationPreferenceRepository.save(existing);
      return this.toPreferenceDomain(saved);
    }

    const preference = this.notificationPreferenceRepository.create({
      userId: createDto.userId,
      notificationType: createDto.notificationType,
      channel: createDto.channel,
      isEnabled: createDto.isEnabled,
    });

    const saved = await this.notificationPreferenceRepository.save(preference);
    return this.toPreferenceDomain(saved);
  }

  async findPreferencesByUserId(userId: string): Promise<NotificationPreference[]> {
    const preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    return preferences.map((p) => this.toPreferenceDomain(p));
  }

  async updatePreference(
    id: string,
    updateDto: UpdateNotificationPreferenceDto,
  ): Promise<NullableType<NotificationPreference>> {
    const preference = await this.notificationPreferenceRepository.findOne({
      where: { preferenceId: id },
    });

    if (!preference) {
      return null;
    }

    if (updateDto.isEnabled !== undefined) {
      preference.isEnabled = updateDto.isEnabled;
    }

    const saved = await this.notificationPreferenceRepository.save(preference);
    return this.toPreferenceDomain(saved);
  }

  async deletePreference(id: string): Promise<void> {
    await this.notificationPreferenceRepository.delete(id);
  }

  async markAsRead(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id },
    });

    if (notification) {
      notification.readAt = new Date();
      notification.status = NotificationStatus.READ;
      await this.notificationRepository.save(notification);
    }
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    // Unread = not yet read by the user. APP notifications are marked "sent"
    // the moment they're stored, so counting by status=pending always returned 0.
    return this.notificationRepository.count({
      where: {
        recipientId,
        readAt: IsNull(),
      },
    });
  }

  // ── Domain Mappers ─────────────────────────────────────────────

  private toNotificationDomain(entity: NotificationEntity): Notification {
    const domain = new Notification();
    domain.notificationId = entity.notificationId;
    domain.recipientId = entity.recipientId;
    domain.templateId = entity.templateId;
    domain.notificationType = entity.notificationType;
    domain.channel = entity.channel as NotificationChannel;
    domain.subject = entity.subject;
    domain.message = entity.message;
    domain.relatedEntityId = entity.relatedEntityId;
    domain.relatedEntityType = entity.relatedEntityType;
    domain.scheduledAt = entity.scheduledAt;
    domain.sentAt = entity.sentAt;
    domain.readAt = entity.readAt;
    domain.status = entity.status as NotificationStatus;
    domain.retryCount = entity.retryCount;
    domain.maxRetries = entity.maxRetries;
    domain.nextRetryAt = entity.nextRetryAt;
    domain.errorMessage = entity.errorMessage;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  private toTemplateDomain(entity: NotificationTemplateEntity): NotificationTemplate {
    const domain = new NotificationTemplate();
    domain.templateId = entity.templateId;
    domain.templateCode = entity.templateCode;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.subjectTemplate = entity.subjectTemplate;
    domain.bodyTemplate = entity.bodyTemplate;
    domain.channel = entity.channel as NotificationChannel;
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  private toPreferenceDomain(entity: any): NotificationPreference {
    const domain = new NotificationPreference();
    domain.preferenceId = entity.preferenceId;
    domain.userId = entity.userId;
    domain.notificationType = entity.notificationType;
    domain.channel = entity.channel;
    domain.isEnabled = entity.isEnabled;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }
}
