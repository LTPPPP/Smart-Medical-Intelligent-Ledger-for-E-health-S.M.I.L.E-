import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { LockAccountDto } from './dto/lock-account.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { Account } from './domain/account';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';

@ApiTags('Accounts')
@Controller({
  path: 'accounts',
  version: '1',
})
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  // Only ADMIN can create accounts (with custom roles like DOCTOR/ADMIN)
  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: Account })
  async create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  // Any authenticated user can view their own profile
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Account })
  async me(@Request() request): Promise<Account | null> {
    return this.accountsService.findById(request.user.accountId);
  }

  // Any authenticated user can update their own profile
  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update one or more profile fields (fullName, gender, email, phone, password) for the authenticated user.',
  })
  @ApiBody({
    type: UpdateAccountDto,
    examples: {
      updateProfile: {
        summary: 'Update name and gender',
        value: { fullName: 'Nguyễn Văn A', gender: 'MALE' },
      },
      updateContact: {
        summary: 'Update contact info',
        value: { email: 'new@example.com', phone: '+84901234567' },
      },
      changePassword: {
        summary: 'Change password',
        value: { password: 'newPassword123' },
      },
    },
  })
  @ApiOkResponse({ type: Account })
  async updateMe(@Request() request, @Body() updateAccountDto: UpdateAccountDto): Promise<Account | null> {
    return this.accountsService.update(request.user.accountId, updateAccountDto);
  }

  // Any authenticated user can delete their own account
  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMe(@Request() request): Promise<void> {
    return this.accountsService.remove(request.user.accountId);
  }

  // UC-020: KYC Phone Verification — authenticated user verifies their phone
  @ApiBearerAuth()
  @Post('me/phone/send-otp')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' }, devOtp: { type: 'string' } } } })
  async sendPhoneOtp(@Request() request): Promise<{ message: string; devOtp?: string }> {
    return this.accountsService.createPhoneVerificationOtp(request.user.accountId);
  }

  @ApiBearerAuth()
  @Post('me/verify-phone')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async verifyPhone(@Request() request, @Body() dto: VerifyPhoneDto): Promise<{ message: string }> {
    await this.accountsService.verifyPhoneWithOtp(request.user.accountId, dto.otp);
    return { message: 'Phone number verified successfully' };
  }

  // ADMIN and DOCTOR can view other user profiles
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOkResponse({ type: Account })
  async findById(@Param('id') id: string): Promise<Account | null> {
    return this.accountsService.findById(id);
  }

  // Only ADMIN can update other user accounts
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOkResponse({ type: Account })
  async update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto): Promise<Account | null> {
    return this.accountsService.update(id, updateAccountDto);
  }

  // Only ADMIN can delete other user accounts
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.accountsService.remove(id);
  }

  // UC-021: Lock/Ban account — ADMIN only
  @ApiBearerAuth()
  @Post(':id/lock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async lockAccount(
    @Param('id') id: string,
    @Request() request,
    @Body() dto: LockAccountDto,
  ): Promise<{ message: string }> {
    await this.accountsService.lockAccount(id, dto.reason, request.user.accountId);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_LOCK',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { reason: dto.reason },
    });
    return { message: 'Account locked successfully' };
  }

  // UC-022: Unlock account — ADMIN only
  @ApiBearerAuth()
  @Post(':id/unlock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async unlockAccount(@Request() request, @Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.unlockAccount(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_UNLOCK',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return { message: 'Account unlocked successfully' };
  }

  // K1: soft-delete an account (DEACTIVATED) — ADMIN only
  @ApiBearerAuth()
  @Post(':id/deactivate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async deactivateAccount(@Request() request, @Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.deactivate(id);
    // Deactivated users must not keep live sessions.
    await this.refreshTokensService.revokeByAccountId(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_DEACTIVATE',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return { message: 'Account deactivated successfully' };
  }

  // K1: reactivate a soft-deleted account — ADMIN only
  @ApiBearerAuth()
  @Post(':id/reactivate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async reactivateAccount(@Request() request, @Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.reactivate(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_REACTIVATE',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return { message: 'Account reactivated successfully' };
  }

  // K1: admin-initiated password reset — ADMIN only. The new password is never
  // written to the audit log.
  @ApiBearerAuth()
  @Post(':id/reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async resetPassword(
    @Request() request,
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.accountsService.setPassword(id, dto.password);
    // Force re-authentication everywhere after a password change.
    await this.refreshTokensService.revokeByAccountId(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_RESET_PASSWORD',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return { message: 'Password reset successfully' };
  }

  // K1: force logout — revoke all refresh tokens for the account — ADMIN only
  @ApiBearerAuth()
  @Post(':id/force-logout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async forceLogout(@Request() request, @Param('id') id: string): Promise<{ message: string }> {
    await this.refreshTokensService.revokeByAccountId(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ACCOUNT_FORCE_LOGOUT',
      resource: 'account',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return { message: 'All sessions revoked successfully' };
  }
}
