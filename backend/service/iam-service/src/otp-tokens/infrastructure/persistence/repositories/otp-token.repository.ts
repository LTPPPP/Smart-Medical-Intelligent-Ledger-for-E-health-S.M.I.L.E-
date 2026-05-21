import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { OtpToken, OtpType } from '../../../domain/otp-token';
import { OtpTokenEntity } from '@auth/otp-tokens/infrastructure/persistence/relational/entities/otp-token.entity';
import { NullableType } from '../../../../utils/types/nullable.type';

@Injectable()
export class OtpTokensRepository {
  constructor(
    @InjectRepository(OtpTokenEntity)
    private readonly repository: Repository<OtpTokenEntity>,
  ) {}

  async findById(id: string): Promise<NullableType<OtpToken>> {
    const entity = await this.repository.findOne({
      where: { otpId: id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAccountAndType(
    accountId: string,
    otpType: OtpType,
  ): Promise<NullableType<OtpToken>> {
    const entity = await this.repository.findOne({
      where: {
        accountId,
        otpType,
        usedAt: null,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findValidByAccountAndCode(
    accountId: string,
    otpCode: string,
    otpType: OtpType,
  ): Promise<NullableType<OtpToken>> {
    const entity = await this.repository.findOne({
      where: {
        accountId,
        otpCode,
        otpType,
        usedAt: null,
        expiresAt: MoreThan(new Date()),
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(data: Partial<OtpToken>): Promise<OtpToken> {
    const entity = this.repository.create({
      accountId: data.accountId,
      otpCode: data.otpCode,
      otpType: data.otpType,
      expiresAt: data.expiresAt,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repository.update(id, { usedAt: new Date() });
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private toDomain(entity: OtpTokenEntity): OtpToken {
    const domain = new OtpToken();
    domain.otpId = entity.otpId;
    domain.accountId = entity.accountId;
    domain.otpCode = entity.otpCode;
    domain.otpType = entity.otpType;
    domain.expiresAt = entity.expiresAt;
    domain.usedAt = entity.usedAt;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }
}
