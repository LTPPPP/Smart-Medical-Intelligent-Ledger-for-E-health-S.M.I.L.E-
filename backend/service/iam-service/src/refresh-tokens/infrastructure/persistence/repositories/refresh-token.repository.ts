import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../../../domain/refresh-token';
import { RefreshTokenEntity } from '@auth/refresh-tokens/infrastructure/persistence/relational/entities/refresh-token.entity';
import { NullableType } from '../../../../utils/types/nullable.type';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>,
  ) {}

  async findById(id: string): Promise<NullableType<RefreshToken>> {
    const entity = await this.repository.findOne({
      where: { tokenId: id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAccountId(accountId: string): Promise<RefreshToken[]> {
    const entities = await this.repository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(this.toDomain);
  }

  async findByTokenHash(tokenHash: string): Promise<NullableType<RefreshToken>> {
    const entity = await this.repository.findOne({
      where: { tokenHash },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const entity = this.repository.create({
      accountId: data.accountId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeByAccountId(accountId: string): Promise<void> {
    await this.repository.update(
      { accountId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
    const domain = new RefreshToken();
    domain.tokenId = entity.tokenId;
    domain.accountId = entity.accountId;
    domain.tokenHash = entity.tokenHash;
    domain.expiresAt = entity.expiresAt;
    domain.revokedAt = entity.revokedAt;
    domain.deviceInfo = entity.deviceInfo;
    domain.ipAddress = entity.ipAddress;
    domain.createdAt = entity.createdAt;
    return domain;
  }
}
