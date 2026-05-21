import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthConnection } from '../../../domain/oauth-connection';
import { OAuthConnectionEntity } from '@auth/oauth-connections/infrastructure/persistence/relational/entities/oauth-connection.entity';
import { NullableType } from '../../../../utils/types/nullable.type';

@Injectable()
export class OAuthConnectionsRepository {
  constructor(
    @InjectRepository(OAuthConnectionEntity)
    private readonly repository: Repository<OAuthConnectionEntity>,
  ) {}

  async findById(id: string): Promise<NullableType<OAuthConnection>> {
    const entity = await this.repository.findOne({
      where: { connectionId: id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAccountId(accountId: string): Promise<OAuthConnection[]> {
    const entities = await this.repository.find({
      where: { accountId, isActive: true },
    });
    return entities.map(this.toDomain);
  }

  async findByProviderAndUserId(
    provider: string,
    providerUserId: string,
  ): Promise<NullableType<OAuthConnection>> {
    const entity = await this.repository.findOne({
      where: { provider, providerUserId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(data: Partial<OAuthConnection>): Promise<OAuthConnection> {
    const entity = this.repository.create({
      accountId: data.accountId,
      provider: data.provider,
      providerUserId: data.providerUserId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      isActive: data.isActive ?? true,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: Partial<OAuthConnection>,
  ): Promise<OAuthConnection | null> {
    const entity = await this.repository.findOne({
      where: { connectionId: id },
    });
    if (!entity) return null;

    Object.assign(entity, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      isActive: data.isActive,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ connectionId: id });
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    await this.repository.delete({ accountId });
  }

  private toDomain(entity: OAuthConnectionEntity): OAuthConnection {
    const domain = new OAuthConnection();
    domain.connectionId = entity.connectionId;
    domain.accountId = entity.accountId;
    domain.provider = entity.provider;
    domain.providerUserId = entity.providerUserId;
    domain.accessToken = entity.accessToken;
    domain.refreshToken = entity.refreshToken;
    domain.tokenExpiresAt = entity.tokenExpiresAt;
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }
}
