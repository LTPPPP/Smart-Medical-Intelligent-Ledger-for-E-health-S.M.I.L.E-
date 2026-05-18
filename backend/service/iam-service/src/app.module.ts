import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
      envFilePath: ['.env'],
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
  ],
})
export class AppModule {}
