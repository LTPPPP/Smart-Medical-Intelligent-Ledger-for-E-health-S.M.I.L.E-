import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import Redis from 'ioredis';
import { AccountsService } from '../../accounts/accounts.service';
import { AccountStatus } from '../../accounts/domain/account';
import { getSanitizedErrorMetadata } from '../../common/error-metadata';
import { JwtPayloadType } from './types/jwt-payload.type';
import { REDIS_CLIENT, tokenBlacklistKey } from '../../redis/redis.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService<any>,
    private readonly accountsService: AccountsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_JWT_SECRET,
    });
  }

  async validate(payload: JwtPayloadType) {
    // Every token this service issues carries a jti (auth.service.ts
    // getTokensData). A token without one predates that claim and cannot be
    // revoked, so it is not accepted.
    if (!payload.jti) {
      throw new UnauthorizedException();
    }

    // Reject tokens blacklisted by logout. A Redis outage fails CLOSED — we
    // cannot prove the token was not revoked, and access tokens outlive the
    // outage.
    const blacklisted = await this.redis
      .exists(tokenBlacklistKey(payload.jti))
      .catch((error: unknown) => {
        const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
        this.logger.warn(
          `operation=redis_token_blacklist_check outcome=failed error_class=${errorClass} error_code=${errorCode}`,
        );
        return 1;
      });
    if (blacklisted) {
      throw new UnauthorizedException();
    }

    const account = await this.accountsService.findById(payload.accountId);

    if (!account) {
      throw new UnauthorizedException();
    }

    // A locked, suspended or soft-deleted account must lose access
    // immediately, not when its access token happens to expire.
    if (account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      accountId: account.accountId,
      email: account.email,
      role: account.role,
      status: account.status,
      jti: payload.jti,
      tokenExp: payload.exp,
    };
  }
}
