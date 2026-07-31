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
import { PushSubscriptionEntity } from './infrastructure/persistence/relational/entities/push-subscription.entity';
import { PushSubscriptionRepository } from './infrastructure/persistence/relational/repositories/push-subscription.repository';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { InternalServiceGuard } from './guards/internal-service.guard';
import { MailModule } from '../mail/mail.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        NotificationTemplateEntity,
        NotificationPreferenceEntity,
        NotificationEntity,
        NotificationDeliveryLogEntity,
        PushSubscriptionEntity,
      ],
      'iamUserConnection',
    ),
    MailModule,
    AccountsModule,
  ],
  controllers: [NotificationsController, NotificationTemplatesController, NotificationPreferencesController],
  providers: [
    NotificationsService,
    PushSubscriptionsService,
    HandlebarsService,
    InternalServiceGuard,
    EmailGateway,
    SmsGateway,
    PushGateway,
    InAppGateway,
    NotificationTemplateRepository,
    NotificationPreferenceRepository,
    NotificationRepository,
    NotificationDeliveryLogRepository,
    PushSubscriptionRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
