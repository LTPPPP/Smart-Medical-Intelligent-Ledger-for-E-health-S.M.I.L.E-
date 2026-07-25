import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { AccountEntity } from '../../../../../accounts/infrastructure/persistence/relational/entities/account.entity';

@Entity({
  name: 'refresh_tokens',
})
export class RefreshTokenEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'token_id' })
  tokenId: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  @Index()
  accountId: string | null;

  @ManyToOne(() => AccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ type: 'char', length: 64, nullable: false, name: 'token_hash' })
  @Index()
  tokenHash: string;

  @Column({ type: 'timestamp', nullable: false, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'device_info' })
  deviceInfo: string | null;

  @Column({ type: String, length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
