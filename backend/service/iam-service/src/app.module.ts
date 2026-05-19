import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig],
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
      ],
    }),
    AccountsModule,
    AuthModule,
  ],
})
export class AppModule { }
