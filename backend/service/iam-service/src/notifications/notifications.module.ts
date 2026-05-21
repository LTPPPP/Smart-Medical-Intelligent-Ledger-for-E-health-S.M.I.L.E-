import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  NotificationTemplatesController,
  NotificationPreferencesController,
} from './notifications.controller';
import { HandlebarsService } from './handlebars.service';
import { EmailGateway } from './gateways/email.gateway';
import { SmsGateway } from './gateways/sms.gateway';
import { PushGateway } from './gateways/push.gateway';
import { InAppGateway } from './gateways/in-app.gateway';
import { NotificationTemplateEntity } from './infrastructure/persistence/relational/entities/notification-template.entity';
import { NotificationPreferenceEntity } from './infrastructure/persistence/relational/entities/notification-preference.entity';
import { NotificationEntity } from './infrastructure/persistence/relational/entities/notification.entity';
import { NotificationDeliveryLogEntity } from './infrastructure/persistence/relational/entities/notification-delivery-log.entity';
import { NotificationTemplateRepository } from './infrastructure/persistence/relational/repositories/notification-template.repository';
import { NotificationPreferenceRepository } from './infrastructure/persistence/relational/repositories/notification-preference.repository';
import { NotificationRepository } from './infrastructure/persistence/relational/repositories/notification.repository';
import { NotificationDeliveryLogRepository } from './infrastructure/persistence/relational/repositories/notification-delivery-log.repository';
import { MailModule } from '@auth/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [NotificationTemplateEntity, NotificationPreferenceEntity, NotificationEntity, NotificationDeliveryLogEntity],
      'iamUserConnection',
    ),
    MailModule,
  ],
  controllers: [NotificationsController, NotificationTemplatesController, NotificationPreferencesController],
  providers: [
    NotificationsService,
    HandlebarsService,
    EmailGateway,
    SmsGateway,
    PushGateway,
    InAppGateway,
    NotificationTemplateRepository,
    NotificationPreferenceRepository,
    NotificationRepository,
    NotificationDeliveryLogRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
