import { Account } from '../../../../domain/account';
import { AccountEntity } from '../entities/account.entity';

export class AccountMapper {
  static toDomain(entity: AccountEntity): Account {
    const domain = new Account();
    domain.accountId = entity.accountId;
    domain.username = entity.username;
    domain.email = entity.email;
    domain.phone = entity.phone;
    domain.passwordHash = entity.passwordHash ?? undefined;
    domain.role = entity.role;
    domain.status = entity.status;
    domain.failedLoginAttempts = entity.failedLoginAttempts;
    domain.lockedAt = entity.lockedAt;
    domain.lockedReason = entity.lockedReason;
    domain.lockedBy = entity.lockedBy;
    domain.emailVerified = entity.emailVerified;
    domain.phoneVerified = entity.phoneVerified;
    domain.lastLoginAt = entity.lastLoginAt;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.createdBy = entity.createdBy;
    domain.updatedBy = entity.updatedBy;
    return domain;
  }

  static toDomainPartial(entity: Partial<AccountEntity>): Partial<Account> {
    const domain: Partial<Account> = {};
    if (entity.accountId !== undefined) domain.accountId = entity.accountId;
    if (entity.username !== undefined) domain.username = entity.username;
    if (entity.email !== undefined) domain.email = entity.email;
    if (entity.phone !== undefined) domain.phone = entity.phone;
    if (entity.passwordHash !== undefined) domain.passwordHash = entity.passwordHash ?? undefined;
    if (entity.role !== undefined) domain.role = entity.role;
    if (entity.status !== undefined) domain.status = entity.status;
    if (entity.failedLoginAttempts !== undefined)
      domain.failedLoginAttempts = entity.failedLoginAttempts;
    if (entity.lockedAt !== undefined) domain.lockedAt = entity.lockedAt;
    if (entity.lockedReason !== undefined) domain.lockedReason = entity.lockedReason;
    if (entity.lockedBy !== undefined) domain.lockedBy = entity.lockedBy;
    if (entity.emailVerified !== undefined) domain.emailVerified = entity.emailVerified;
    if (entity.phoneVerified !== undefined) domain.phoneVerified = entity.phoneVerified;
    if (entity.lastLoginAt !== undefined) domain.lastLoginAt = entity.lastLoginAt;
    if (entity.createdAt !== undefined) domain.createdAt = entity.createdAt;
    if (entity.updatedAt !== undefined) domain.updatedAt = entity.updatedAt;
    if (entity.createdBy !== undefined) domain.createdBy = entity.createdBy;
    if (entity.updatedBy !== undefined) domain.updatedBy = entity.updatedBy;
    return domain;
  }
}
