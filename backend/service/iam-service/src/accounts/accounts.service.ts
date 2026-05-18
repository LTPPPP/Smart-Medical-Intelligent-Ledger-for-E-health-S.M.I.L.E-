import { HttpStatus, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { hash, genSalt } from 'bcryptjs';
import { CreateAccountDto } from './dto/create-account.dto';
import { NullableType } from '@auth/utils/types/nullable.type';
import { AccountsRepository } from './infrastructure/persistence/relational/repositories/account.repository';
import { Account, AccountStatus, RoleEnum } from './domain/account';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

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

    const salt = await genSalt();
    const passwordHash = await hash(createAccountDto.password, salt);

    return this.accountsRepository.create({
      username: createAccountDto.username,
      email: createAccountDto.email,
      phone: createAccountDto.phone,
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
}
