import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from './infrastructure/persistence/repositories/refresh-token.repository';
import { RefreshToken } from './domain/refresh-token';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async findById(id: string): Promise<NullableType<RefreshToken>> {
    return this.refreshTokensRepository.findById(id);
  }

  async findByAccountId(accountId: string): Promise<RefreshToken[]> {
    return this.refreshTokensRepository.findByAccountId(accountId);
  }

  async findByTokenHash(tokenHash: string): Promise<NullableType<RefreshToken>> {
    return this.refreshTokensRepository.findByTokenHash(tokenHash);
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    return this.refreshTokensRepository.create(data);
  }

  async revoke(id: string): Promise<void> {
    return this.refreshTokensRepository.revoke(id);
  }

  async revokeByAccountId(accountId: string): Promise<void> {
    return this.refreshTokensRepository.revokeByAccountId(accountId);
  }

  async deleteExpired(): Promise<void> {
    return this.refreshTokensRepository.deleteExpired();
  }
}
