import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import googleConfig from './auth-google/config/google.config';
import redisConfig from './config/redis.config';
import { RedisModule } from './redis/redis.module';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { UserProfilesModule } from './users/user-profiles.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { KycVerificationsModule } from './kyc-verifications/kyc-verifications.module';
import { HealthModule } from './health/health.module';
import { NotificationTemplateEntity } from './notifications/infrastructure/persistence/relational/entities/notification-template.entity';
import { NotificationPreferenceEntity } from './notifications/infrastructure/persistence/relational/entities/notification-preference.entity';
import { NotificationEntity } from './notifications/infrastructure/persistence/relational/entities/notification.entity';
import { NotificationDeliveryLogEntity } from './notifications/infrastructure/persistence/relational/entities/notification-delivery-log.entity';
import { RoleEntity } from './roles/entities/role.entity';
import { PermissionEntity } from './permissions/entities/permission.entity';
import { RolePermissionEntity } from './permissions/entities/role-permission.entity';
import { UserRoleEntity } from './user-roles/entities/user-role.entity';
import { UserProfileEntity } from './users/entities/user-profile.entity';
import { AuditLogEntity } from './audit-logs/entities/audit-log.entity';
import { KycVerificationEntity } from './kyc-verifications/entities/kyc-verification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        googleConfig,
        redisConfig,
      ],
      envFilePath: ['.env'],
    }),
    RedisModule,
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
      logging: process.env.USER_DATABASE_LOGGING === 'true',
      autoLoadEntities: true,
      entities: [
        UserProfileEntity,
        RoleEntity,
        PermissionEntity,
        RolePermissionEntity,
        UserRoleEntity,
        AuditLogEntity,
        KycVerificationEntity,
        NotificationTemplateEntity,
        NotificationPreferenceEntity,
        NotificationEntity,
        NotificationDeliveryLogEntity,
        RoleEntity,
        PermissionEntity,
        RolePermissionEntity,
        UserRoleEntity,
        UserProfileEntity,
        AuditLogEntity,
        KycVerificationEntity,
      ],
    }),
    AccountsModule,
    AuthModule,
    AuthGoogleModule,
    MailModule,
    KycVerificationsModule,
    NotificationsModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    UserProfilesModule,
    AuditLogsModule,
    KycVerificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
