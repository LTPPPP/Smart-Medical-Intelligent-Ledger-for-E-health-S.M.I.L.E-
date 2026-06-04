import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokensService } from '../../refresh-tokens/refresh-tokens.service';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService<any>,
    private readonly refreshTokensService: RefreshTokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_REFRESH_SECRET,
    });
  }

  async validate(payload: JwtRefreshPayloadType) {
    const refreshToken = await this.refreshTokensService.findById(payload.tokenId);

    if (!refreshToken || refreshToken.revokedAt) {
      throw new UnauthorizedException();
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException();
    }

    return {
      tokenId: refreshToken.tokenId,
      accountId: refreshToken.accountId,
    };
  }
}
