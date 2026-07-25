import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { AccountEntity } from '../../../../../accounts/infrastructure/persistence/relational/entities/account.entity';
import { OtpType } from '@auth/otp-tokens/domain/otp-token';

@Entity({
  name: 'otp_tokens',
})
export class OtpTokenEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'otp_id' })
  otpId: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  @Index()
  accountId: string | null;

  @ManyToOne(() => AccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ type: 'char', length: 6, nullable: false, name: 'otp_code' })
  otpCode: string;

  @Column({
    type: String,
    length: 15,
    nullable: false,
    name: 'otp_type',
  })
  otpType: OtpType;

  @Column({ type: 'timestamp', nullable: false, name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'used_at' })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
