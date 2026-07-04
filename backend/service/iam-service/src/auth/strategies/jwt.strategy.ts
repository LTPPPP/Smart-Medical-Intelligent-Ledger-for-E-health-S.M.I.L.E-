import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import Redis from 'ioredis';
import { AccountsService } from '../../accounts/accounts.service';
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
    // Reject tokens blacklisted by logout. Tokens issued before the jti claim
    // existed skip this check; a Redis outage fails open (signature + expiry
    // are still enforced).
    if (payload.jti) {
      const blacklisted = await this.redis
        .exists(tokenBlacklistKey(payload.jti))
        .catch((err: Error) => {
          this.logger.warn(
            `Redis unavailable, skipping token blacklist check: ${err.message}`,
          );
          return 0;
        });
      if (blacklisted) {
        throw new UnauthorizedException();
      }
    }

    const account = await this.accountsService.findById(payload.accountId);

    if (!account) {
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
