import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { AccountEntity } from '../../../../../accounts/infrastructure/persistence/relational/entities/account.entity';

@Entity({
  name: 'oauth_connections',
})
@Unique(['provider', 'providerUserId'])
export class OAuthConnectionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'connection_id' })
  connectionId: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  @Index()
  accountId: string | null;

  @ManyToOne(() => AccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ type: String, length: 8, nullable: false, name: 'provider' })
  provider: string;

  @Column({ type: String, length: 255, nullable: false, name: 'provider_user_id' })
  providerUserId: string;

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken: string | null;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'token_expires_at' })
  tokenExpiresAt: Date | null;

  @Column({ type: Boolean, default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
