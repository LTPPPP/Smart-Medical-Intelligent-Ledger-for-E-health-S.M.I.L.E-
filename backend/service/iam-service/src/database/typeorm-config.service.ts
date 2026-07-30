import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';
import { RefreshTokenEntity } from '../refresh-tokens/infrastructure/persistence/relational/entities/refresh-token.entity';
import { OAuthConnectionEntity } from '../oauth-connections/infrastructure/persistence/relational/entities/oauth-connection.entity';
import { OtpTokenEntity } from '../otp-tokens/infrastructure/persistence/relational/entities/otp-token.entity';

@Injectable()
export class TypeOrmConfigService {
  constructor(private configService: ConfigService<any>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      logging: process.env.DATABASE_LOGGING === 'true',
      entities: [AccountEntity, RefreshTokenEntity, OAuthConnectionEntity, OtpTokenEntity],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      extra: {
        max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      },
    };
  }
}
