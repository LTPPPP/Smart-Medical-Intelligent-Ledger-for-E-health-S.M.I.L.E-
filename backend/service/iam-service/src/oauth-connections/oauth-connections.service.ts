import { Injectable } from '@nestjs/common';
import { OAuthConnectionsRepository } from './infrastructure/persistence/repositories/oauth-connection.repository';
import { OAuthConnection } from './domain/oauth-connection';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class OAuthConnectionsService {
  constructor(
    private readonly oAuthConnectionsRepository: OAuthConnectionsRepository,
  ) {}

  async findById(id: string): Promise<NullableType<OAuthConnection>> {
    return this.oAuthConnectionsRepository.findById(id);
  }

  async findByAccountId(accountId: string): Promise<OAuthConnection[]> {
    return this.oAuthConnectionsRepository.findByAccountId(accountId);
  }

  async findByProviderAndUserId(
    provider: string,
    providerUserId: string,
  ): Promise<NullableType<OAuthConnection>> {
    return this.oAuthConnectionsRepository.findByProviderAndUserId(
      provider,
      providerUserId,
    );
  }

  async create(data: Partial<OAuthConnection>): Promise<OAuthConnection> {
    return this.oAuthConnectionsRepository.create(data);
  }

  async update(
    id: string,
    data: Partial<OAuthConnection>,
  ): Promise<OAuthConnection | null> {
    return this.oAuthConnectionsRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.oAuthConnectionsRepository.delete(id);
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    return this.oAuthConnectionsRepository.deleteByAccountId(accountId);
  }
}
