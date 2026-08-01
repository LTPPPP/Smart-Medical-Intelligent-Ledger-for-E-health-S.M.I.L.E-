import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as ms from 'ms';
import Redis from 'ioredis';
import { createHash, randomUUID } from 'node:crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from '../social/interfaces/social.interface';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AccountsService } from '../accounts/accounts.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { OAuthConnectionsService } from '../oauth-connections/oauth-connections.service';
import { OtpTokensService } from '../otp-tokens/otp-tokens.service';
import { UserProfilesService } from '../users/user-profiles.service';
import { OtpType } from '../otp-tokens/domain/otp-token';
import { AccountStatus, RoleEnum } from '../accounts/domain/account';
import { Account } from '../accounts/domain/account';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { AllConfigType } from '../config/config.type';
import { REDIS_CLIENT, tokenBlacklistKey } from '../redis/redis.constants';
import { getSanitizedErrorMetadata } from '../common/error-metadata';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly accountsService: AccountsService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly oAuthConnectionsService: OAuthConnectionsService,
    private readonly otpTokensService: OtpTokensService,
    private readonly userProfilesService: UserProfilesService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const account = await this.accountsService.findByEmail(loginDto.email);

    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: `accountIs${account.status}`,
        },
      });
    }

    if (!account.passwordHash) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await compare(loginDto.password, account.passwordHash);

    if (!isValidPassword) {
      const newAttempts = account.failedLoginAttempts + 1;
      await this.accountsService.updateFailedLoginAttempts(account.accountId, newAttempts);

      if (newAttempts >= 5) {
        await this.accountsService.lockAccount(account.accountId, 'Too many failed login attempts', null);
      }

      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    await this.accountsService.updateLastLogin(account.accountId);

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      accountId: account.accountId,
      email: account.email,
      role: account.role,
      status: account.status,
    });

    const userProfile = await this.userProfilesService.findById(account.accountId);

    return {
      refreshToken,
      token,
      tokenExpires,
      user: account,
      userProfile,
    };
  }

  async validateSocialLogin(authProvider: string, socialData: SocialInterface): Promise<LoginResponseDto> {
    const socialEmail = socialData.email?.toLowerCase();

    let connection = await this.oAuthConnectionsService.findByProviderAndUserId(authProvider, socialData.id);

    let account: Account | null = null;

    if (connection?.accountId) {
      account = await this.accountsService.findById(connection.accountId);
    }

    if (!account && socialEmail) {
      account = await this.accountsService.findByEmail(socialEmail);
    }

    if (!account) {
      const fullName = socialData.firstName
        ? `${socialData.firstName} ${socialData.lastName ?? ''}`.trim()
        : (socialEmail ?? '');

      // Generate Username
      const emailLocal = (socialEmail ?? '').split('@')[0];
      const baseUsername = emailLocal.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      const username = `${baseUsername}_${Date.now().toString(36)}`;

      account = await this.accountsService.create({
        email: socialEmail ?? '',
        fullName,
        username,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        role: RoleEnum.PATIENT,
      } as any);

      // Create User Profile
      await this.userProfilesService.create(
        {
          full_name: fullName,
          email: socialEmail ?? null,
        },
        account.accountId,
      );
    }

    // Already Verified
    if (!account.emailVerified) {
      await this.accountsService.verifyEmail(account.accountId);
      account.emailVerified = true;
    }

    if (connection) {
      await this.oAuthConnectionsService.update(connection.connectionId, {
        accountId: account.accountId,
      });
    } else {
      await this.oAuthConnectionsService.create({
        accountId: account.accountId,
        provider: authProvider,
        providerUserId: socialData.id,
      });
    }

    await this.accountsService.updateLastLogin(account.accountId);

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      accountId: account.accountId,
      email: account.email,
      role: account.role,
      status: account.status,
    });

    const userProfile = await this.userProfilesService.findById(account.accountId);

    return {
      refreshToken,
      token,
      tokenExpires,
      user: account,
      userProfile,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<{ message: string }> {
    const account = await this.accountsService.create({
      email: dto.email,
      password: dto.password,
      username: dto.username,
      phone: dto.phone,
      fullName: dto.fullName ?? dto.username ?? dto.email,
      gender: dto.gender,
    } as any);

    // Create User Profile
    await this.userProfilesService.create(
      {
        full_name: dto.fullName ?? dto.username ?? dto.email,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        gender: dto.gender ?? null,
      },
      account.accountId,
    );

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailAccountId: account.accountId,
      },
      {
        secret: this.configService.get('auth.confirmEmailSecret'),
        expiresIn: this.configService.get('auth.confirmEmailExpires'),
      },
    );

    return {
      message: 'Registration successful. Please check your email to confirm your account.',
    };
  }

  async confirmEmail(hash: string): Promise<{ message: string }> {
    let accountId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailAccountId: string;
      }>(hash, {
        secret: this.configService.get('auth.confirmEmailSecret'),
      });

      accountId = jwtData.confirmEmailAccountId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const account = await this.accountsService.findById(accountId);

    if (!account || account.emailVerified) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    await this.accountsService.verifyEmail(accountId);

    return {
      message: 'Email confirmed successfully.',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const account = await this.accountsService.findByEmail(email);

    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    const tokenExpiresIn = this.configService.get('auth.forgotExpires');

    const hash = await this.jwtService.signAsync(
      {
        forgotAccountId: account.accountId,
      },
      {
        secret: this.configService.get('auth.forgotSecret'),
        expiresIn: tokenExpiresIn,
      },
    );

    return {
      message: 'Password reset link sent to your email.',
    };
  }

  async resetPassword(hash: string, password: string): Promise<{ message: string }> {
    let accountId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotAccountId: string;
      }>(hash, {
        secret: this.configService.get('auth.forgotSecret'),
      });

      accountId = jwtData.forgotAccountId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const account = await this.accountsService.findById(accountId);

    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    await this.accountsService.update(accountId, { password } as any);

    await this.refreshTokensService.revokeByAccountId(accountId);

    return {
      message: 'Password reset successfully.',
    };
  }

  async me(accountId: string): Promise<Account | null> {
    return this.accountsService.findById(accountId);
  }

  async update(accountId: string, userDto: AuthUpdateDto): Promise<Account | null> {
    const currentAccount = await this.accountsService.findById(accountId);

    if (!currentAccount) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: 'accountNotFound',
        },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        });
      }

      if (!currentAccount.passwordHash) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      const isValidOldPassword = await compare(userDto.oldPassword, currentAccount.passwordHash);

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      await this.refreshTokensService.revokeByAccountId(accountId);
    }

    return this.accountsService.update(accountId, userDto as any);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'tokenId' | 'accountId'>,
  ): Promise<Omit<LoginResponseDto, 'user' | 'userProfile'>> {
    const refreshToken = await this.refreshTokensService.findById(data.tokenId);

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    if (refreshToken.revokedAt) {
      throw new UnauthorizedException();
    }

    const account = await this.accountsService.findById(data.accountId);

    if (!account) {
      throw new UnauthorizedException();
    }

    await this.refreshTokensService.revoke(data.tokenId);

    const {
      token,
      refreshToken: newRefreshToken,
      tokenExpires,
    } = await this.getTokensData({
      accountId: account.accountId,
      email: account.email,
      role: account.role,
      status: account.status,
    });

    return {
      token,
      refreshToken: newRefreshToken,
      tokenExpires,
    };
  }

  async logout(accountId: string, accessToken?: { jti?: string; exp?: number }): Promise<void> {
    await this.refreshTokensService.revokeByAccountId(accountId);

    // Blacklist Access Token
    if (accessToken?.jti) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const remainingSeconds = accessToken.exp
        ? accessToken.exp - nowSeconds
        : Math.ceil(ms(this.configService.get('auth.expires') as ms.StringValue) / 1000);
      if (remainingSeconds > 0) {
        await this.redis
          .set(tokenBlacklistKey(accessToken.jti), 'logout', 'EX', remainingSeconds)
          .catch((error: unknown) => {
            const { errorClass, errorCode } =
              getSanitizedErrorMetadata(error);
            this.logger.warn(
              `operation=redis_token_blacklist outcome=failed error_class=${errorClass} error_code=${errorCode}`,
            );
          });
      }
    }
  }

  async softDelete(accountId: string): Promise<void> {
    await this.accountsService.remove(accountId);
  }

  private async getTokensData(data: { accountId: string; email: string | null; role: string; status: string }) {
    const tokenExpiresIn = this.configService.get('auth.expires');
    const tokenExpires = Date.now() + ms(tokenExpiresIn as ms.StringValue);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          accountId: data.accountId,
          email: data.email,
          role: data.role,
          status: data.status,
          // Unique Token Id
          jti: randomUUID(),
        },
        {
          secret: this.configService.get('auth.secret'),
          expiresIn: tokenExpiresIn,
        },
      ),
      this.createRefreshToken(data.accountId),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  private async createRefreshToken(accountId: string): Promise<string> {
    const tokenExpiresIn = this.configService.get('auth.refreshExpires');
    const expiresAt = new Date(Date.now() + ms(tokenExpiresIn as ms.StringValue));

    const tokenHash = createHash('sha256').update(randomStringGenerator()).digest('hex');

    await this.refreshTokensService.create({
      accountId,
      tokenHash,
      expiresAt,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        tokenId: (await this.refreshTokensService.findByTokenHash(tokenHash))?.tokenId,
        accountId,
      },
      {
        secret: this.configService.get('auth.refreshSecret'),
        expiresIn: tokenExpiresIn,
      },
    );

    return refreshToken;
  }
}
