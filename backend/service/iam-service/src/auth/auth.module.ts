import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AccountsModule } from '../accounts/accounts.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { OAuthConnectionsModule } from '../oauth-connections/oauth-connections.module';
import { OtpTokensModule } from '../otp-tokens/otp-tokens.module';
import { UserProfilesModule } from '../users/user-profiles.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    AccountsModule,
    RefreshTokensModule,
    OAuthConnectionsModule,
    OtpTokensModule,
    UserProfilesModule,
    AuditLogsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<any>) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get('auth.jwtTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AnonymousStrategy],
  exports: [AuthService],
})
export class AuthModule {}
