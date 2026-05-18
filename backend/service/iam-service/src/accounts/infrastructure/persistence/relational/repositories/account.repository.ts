import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '@auth/accounts/domain/account';
import { AccountEntity } from '../entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
  ) {}

  async findById(id: string): Promise<NullableType<Account>> {
    const entity = await this.accountsRepository.findOne({
      where: { accountId: id },
    });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<NullableType<Account>> {
    const entity = await this.accountsRepository.findOne({
      where: { email },
    });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<NullableType<Account>> {
    const entity = await this.accountsRepository.findOne({
      where: { username },
    });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findByPhone(phone: string): Promise<NullableType<Account>> {
    const entity = await this.accountsRepository.findOne({
      where: { phone },
    });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async create(data: Partial<Account>): Promise<Account> {
    const entity = this.accountsRepository.create({
      username: data.username,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status,
      emailVerified: data.emailVerified,
      phoneVerified: data.phoneVerified,
    });
    const saved = await this.accountsRepository.save(entity);
    return AccountMapper.toDomain(saved);
  }

  async update(id: string, data: Partial<Account>): Promise<Account | null> {
    const entity = await this.accountsRepository.findOne({
      where: { accountId: id },
    });
    if (!entity) return null;

    const updates: Partial<AccountEntity> = {};
    if (data.username !== undefined) updates.username = data.username;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.passwordHash !== undefined) updates.passwordHash = data.passwordHash;
    if (data.role !== undefined) updates.role = data.role;
    if (data.status !== undefined) updates.status = data.status;
    if (data.failedLoginAttempts !== undefined)
      updates.failedLoginAttempts = data.failedLoginAttempts;
    if (data.lockedAt !== undefined) updates.lockedAt = data.lockedAt;
    if (data.lockedReason !== undefined) updates.lockedReason = data.lockedReason;
    if (data.lockedBy !== undefined) updates.lockedBy = data.lockedBy;
    if (data.emailVerified !== undefined) updates.emailVerified = data.emailVerified;
    if (data.phoneVerified !== undefined) updates.phoneVerified = data.phoneVerified;
    if (data.lastLoginAt !== undefined) updates.lastLoginAt = data.lastLoginAt;
    if (data.updatedBy !== undefined) updates.updatedBy = data.updatedBy;

    Object.assign(entity, updates);

    const saved = await this.accountsRepository.save(entity);
    return AccountMapper.toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.accountsRepository.delete({ accountId: id });
  }
}
