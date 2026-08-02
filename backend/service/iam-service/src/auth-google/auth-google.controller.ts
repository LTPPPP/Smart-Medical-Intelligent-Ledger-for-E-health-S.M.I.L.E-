import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Auth')
@Controller({
  path: 'auth/google',
  version: '1',
})
export class AuthGoogleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Post()
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public async login(
    @Request() request,
    @Body() loginDto: AuthGoogleLoginDto,
  ): Promise<LoginResponseDto> {
    const socialData = await this.authGoogleService.validateLogin(loginDto);
    const result = await this.authService.validateSocialLogin('google', socialData);
    void this.auditLogsService.create({
      user_id: result.user.accountId,
      action: 'LOGIN',
      resource: 'auth',
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { email: socialData.email, method: 'google' },
    });
    return result;
  }
}
