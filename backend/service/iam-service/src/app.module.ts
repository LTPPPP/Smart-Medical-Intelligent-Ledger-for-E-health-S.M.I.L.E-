import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationTemplateEntity } from './notifications/infrastructure/persistence/relational/entities/notification-template.entity';
import { NotificationPreferenceEntity } from './notifications/infrastructure/persistence/relational/entities/notification-preference.entity';
import { NotificationEntity } from './notifications/infrastructure/persistence/relational/entities/notification.entity';
import { NotificationDeliveryLogEntity } from './notifications/infrastructure/persistence/relational/entities/notification-delivery-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forRoot({
      name: 'iamUserConnection',
      type: 'postgres',
      host: process.env.USER_DATABASE_HOST || process.env.DATABASE_HOST,
      port: parseInt(process.env.USER_DATABASE_PORT || process.env.DATABASE_PORT || '5432', 10),
      username: process.env.USER_DATABASE_USERNAME || process.env.DATABASE_USERNAME,
      password: process.env.USER_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD,
      database: process.env.USER_DATABASE_NAME || 'account_service_db',
      synchronize: process.env.USER_DATABASE_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV !== 'production',
      entities: [
        NotificationTemplateEntity,
        NotificationPreferenceEntity,
        NotificationEntity,
        NotificationDeliveryLogEntity,
      ],
    }),
    AccountsModule,
    AuthModule,
    MailModule,
    NotificationsModule,
  ],
})
export class AppModule { }
