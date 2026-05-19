import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountsService } from '../../accounts/accounts.service';
import { JwtPayloadType } from './types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<any>,
    private readonly accountsService: AccountsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_JWT_SECRET,
    });
  }

  async validate(payload: JwtPayloadType) {
    const account = await this.accountsService.findById(payload.accountId);

    if (!account) {
      throw new UnauthorizedException();
    }

    return {
      accountId: account.accountId,
      email: account.email,
      role: account.role,
      status: account.status,
    };
  }
}
