import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { hash, genSalt } from 'bcryptjs';
import { CreateAccountDto } from './dto/create-account.dto';
import { NullableType } from '@auth/utils/types/nullable.type';
import { AccountsRepository } from './infrastructure/persistence/relational/repositories/account.repository';
import { Account, AccountStatus, RoleEnum } from './domain/account';
import { UpdateAccountDto } from './dto/update-account.dto';
import { OtpTokensService } from '../otp-tokens/otp-tokens.service';
import { OtpType } from '../otp-tokens/domain/otp-token';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly otpTokensService: OtpTokensService,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const existingByEmail = await this.accountsRepository.findByEmail(createAccountDto.email);
    if (existingByEmail) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailAlreadyExists',
        },
      });
    }

    if (createAccountDto.username) {
      const existingByUsername = await this.accountsRepository.findByUsername(createAccountDto.username);
      if (existingByUsername) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            username: 'usernameAlreadyExists',
          },
        });
      }
    }

    if (createAccountDto.phone) {
      const existingByPhone = await this.accountsRepository.findByPhone(createAccountDto.phone);
      if (existingByPhone) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            phone: 'phoneAlreadyExists',
          },
        });
      }
    }

    const passwordHash = createAccountDto.password
      ? await hash(createAccountDto.password, await genSalt())
      : null;

    return this.accountsRepository.create({
      username: createAccountDto.username,
      email: createAccountDto.email,
      phone: createAccountDto.phone,
      fullName: createAccountDto.fullName,
      gender: createAccountDto.gender,
      passwordHash,
      role: createAccountDto.role || RoleEnum.PATIENT,
      status: AccountStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
    });
  }

  async findById(id: string): Promise<NullableType<Account>> {
    return this.accountsRepository.findById(id);
  }

  async findByEmail(email: string): Promise<NullableType<Account>> {
    return this.accountsRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<NullableType<Account>> {
    return this.accountsRepository.findByUsername(username);
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account | null> {
    const accountUpdates: Partial<Account> = {
      ...updateAccountDto,
    } as any;

    if (updateAccountDto.password) {
      const salt = await genSalt();
      accountUpdates.passwordHash = await hash(updateAccountDto.password, salt);
      delete (accountUpdates as any).password;
    }

    return this.accountsRepository.update(id, accountUpdates);
  }

  async remove(id: string): Promise<void> {
    await this.accountsRepository.remove(id);
  }

  async updateFailedLoginAttempts(accountId: string, attempts: number): Promise<void> {
    await this.accountsRepository.update(accountId, {
      failedLoginAttempts: attempts,
    });
  }

  async updateLastLogin(accountId: string): Promise<void> {
    await this.accountsRepository.update(accountId, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    });
  }

  async lockAccount(accountId: string, reason: string, lockedBy: string | null): Promise<void> {
    await this.accountsRepository.update(accountId, {
      status: AccountStatus.LOCKED,
      lockedAt: new Date(),
      lockedReason: reason,
      lockedBy,
    });
  }

  async unlockAccount(accountId: string): Promise<void> {
    await this.accountsRepository.update(accountId, {
      status: AccountStatus.ACTIVE,
      lockedAt: null,
      lockedReason: null,
      lockedBy: null,
      failedLoginAttempts: 0,
    });
  }

  async verifyEmail(accountId: string): Promise<void> {
    await this.accountsRepository.update(accountId, {
      emailVerified: true,
    });
  }

  async verifyPhone(accountId: string): Promise<void> {
    await this.accountsRepository.update(accountId, {
      phoneVerified: true,
    });
  }

  async createPhoneVerificationOtp(
    accountId: string,
  ): Promise<{ message: string; devOtp?: string }> {
    const token = await this.otpTokensService.create(
      accountId,
      OtpType.IDENTITY_VERIFY,
    );
    return {
      message: 'Phone verification OTP created',
      ...(process.env.NODE_ENV !== 'production' && { devOtp: token.otpCode }),
    };
  }

  async verifyPhoneWithOtp(accountId: string, otp: string): Promise<void> {
    const token = await this.otpTokensService.findValidByAccountAndCode(
      accountId,
      otp,
      OtpType.IDENTITY_VERIFY,
    );
    if (!token) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.otpTokensService.markAsUsed(token.otpId);
    await this.verifyPhone(accountId);
  }
}
