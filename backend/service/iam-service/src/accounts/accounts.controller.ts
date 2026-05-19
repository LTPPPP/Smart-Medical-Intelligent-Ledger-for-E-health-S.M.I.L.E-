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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { LockAccountDto } from './dto/lock-account.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { Account } from './domain/account';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';

@ApiTags('Accounts')
@Controller({
  path: 'accounts',
  version: '1',
})
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

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
  @Post('me/verify-phone')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async verifyPhone(@Request() request, @Body() dto: VerifyPhoneDto): Promise<{ message: string }> {
    // TODO: Validate OTP via OtpTokensService before marking phone as verified
    await this.accountsService.verifyPhone(request.user.accountId);
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
    return { message: 'Account locked successfully' };
  }

  // UC-022: Unlock account — ADMIN only
  @ApiBearerAuth()
  @Post(':id/unlock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async unlockAccount(@Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.unlockAccount(id);
    return { message: 'Account unlocked successfully' };
  }
}
