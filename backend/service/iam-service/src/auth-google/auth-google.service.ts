import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { SocialInterface } from '@auth/social/interfaces/social.interface';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

@Injectable()
export class AuthGoogleService {
  private client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService<any>,
  ) {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async validateLogin(
    loginDto: AuthGoogleLoginDto,
  ): Promise<SocialInterface> {
    const { token } = loginDto;

    // Try verifying as an ID token first
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: [process.env.GOOGLE_CLIENT_ID],
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google token');
      }

      return {
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
      };
    } catch {
      // Fallback: treat token as an access token and call Google's userinfo endpoint
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        throw new Error('Invalid Google access token');
      }

      const userInfo = await response.json() as {
        sub: string;
        email?: string;
        given_name?: string;
        family_name?: string;
      };

      return {
        id: userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
