import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { AVATAR_FOLDER, AvatarUploadSignature, CloudinaryService } from './cloudinary.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AvatarSignatureDto } from './dto/avatar-signature.dto';
import { ConfirmAvatarDto } from './dto/confirm-avatar.dto';
import { LockAccountDto } from './dto/lock-account.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { Account } from './domain/account';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { UserProfilesService } from '../users/user-profiles.service';
import { UserProfileEntity } from '../users/entities/user-profile.entity';

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
    private readonly userProfilesService: UserProfilesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Admin Create Account
  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: Account })
  async create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  // View Own Profile
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Account })
  async me(@Request() request): Promise<Account | null> {
    const account = await this.accountsService.findById(request.user.accountId);
    if (!account) return account;
    return this.withProfileFields(account);
  }

  // Update Own Profile
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
        value: { fullName: 'Nguyễn Văn A', gender: 1 },
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
    const accountId = request.user.accountId;
    const account = await this.accountsService.update(accountId, updateAccountDto);
    if (!account) return account;

    // Update Date Of Birth
    if (updateAccountDto.dateOfBirth !== undefined) {
      await this.userProfilesService.update(accountId, {
        date_of_birth: updateAccountDto.dateOfBirth,
      } as unknown as Partial<UserProfileEntity>);
    }

    return this.withProfileFields(account);
  }

  // Sign Avatar Upload
  @ApiBearerAuth()
  @Post('me/avatar/signature')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get a signed Cloudinary upload payload for the avatar widget' })
  async getAvatarSignature(
    @Request() request,
    @Body() dto: AvatarSignatureDto,
  ): Promise<AvatarUploadSignature> {
    return this.cloudinaryService.generateAvatarSignature(request.user.accountId, { ...dto });
  }

  // Save Avatar Url
  @ApiBearerAuth()
  @Post('me/avatar/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save the avatar URL returned by the Cloudinary widget' })
  @ApiOkResponse({ type: Account })
  async confirmAvatar(@Request() request, @Body() dto: ConfirmAvatarDto): Promise<Account | null> {
    const accountId = request.user.accountId;
    if (!dto.avatarUrl.includes(`/${AVATAR_FOLDER}/${accountId}`)) {
      throw new BadRequestException('Avatar URL does not match this account');
    }

    await this.userProfilesService.update(accountId, {
      avatar_url: dto.avatarUrl,
    } as unknown as Partial<UserProfileEntity>);

    const account = await this.accountsService.findById(accountId);
    return account ? this.withProfileFields(account) : account;
  }

  // Merge Profile Fields
  private async withProfileFields(account: Account): Promise<Account> {
    const profile = await this.userProfilesService.findById(account.accountId);
    return Object.assign(account, {
      dateOfBirth: profile?.date_of_birth ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    });
  }

  // Delete Own Account
  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMe(@Request() request): Promise<void> {
    return this.accountsService.remove(request.user.accountId);
  }

  // Send Phone Otp
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

  // View User Profile
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOkResponse({ type: Account })
  async findById(@Param('id') id: string): Promise<Account | null> {
    return this.accountsService.findById(id);
  }

  // Admin Update Account
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOkResponse({ type: Account })
  async update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto): Promise<Account | null> {
    return this.accountsService.update(id, updateAccountDto);
  }

  // Admin Delete Account
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.accountsService.remove(id);
  }

  // Lock Account
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

  // Unlock Account
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

  // Deactivate Account
  @ApiBearerAuth()
  @Post(':id/deactivate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async deactivateAccount(@Request() request, @Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.deactivate(id);
    // Revoke Live Sessions
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

  // Reactivate Account
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

  // Admin Reset Password
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
    // Revoke Sessions
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

  // Force Logout
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
