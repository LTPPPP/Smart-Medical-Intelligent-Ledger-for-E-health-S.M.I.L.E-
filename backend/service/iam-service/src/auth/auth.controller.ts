import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { Account } from '../accounts/domain/account';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    return this.service.validateLogin(loginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      properties: { message: { type: 'string', example: 'Registration successful, please verify your email.' } },
    },
  })
  async register(@Body() createAccountDto: AuthRegisterLoginDto): Promise<{ message: string }> {
    return this.service.register(createAccountDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string', example: 'Email confirmed successfully.' } } } })
  async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto): Promise<{ message: string }> {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string', example: 'Password reset email sent.' } } } })
  async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto): Promise<{ message: string }> {
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string', example: 'Password reset successfully.' } } } })
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<{ message: string }> {
    return this.service.resetPassword(resetPasswordDto.hash, resetPasswordDto.password);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({
    type: Account,
  })
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<NullableType<Account>> {
    return this.service.me(request.user.accountId);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  public refresh(@Request() request): Promise<RefreshResponseDto> {
    return this.service.refreshToken({
      tokenId: request.user.tokenId,
      accountId: request.user.accountId,
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async logout(@Request() request): Promise<void> {
    await this.service.logout({
      tokenId: request.user.tokenId,
    });
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Account,
  })
  public update(@Request() request, @Body() accountDto: AuthUpdateDto): Promise<NullableType<Account>> {
    return this.service.update(request.user.accountId, accountDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    return this.service.softDelete(request.user.accountId);
  }
}
