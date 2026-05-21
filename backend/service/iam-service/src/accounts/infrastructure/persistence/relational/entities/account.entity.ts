import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { AccountStatus, GenderEnum, RoleEnum } from '@auth/accounts/domain/account';

@Entity({
  name: 'accounts',
})
export class AccountEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  accountId: string;

  @Index()
  @Column({ type: String, unique: true, nullable: true, name: 'username' })
  username: string | null;

  @Index()
  @Column({ type: String, unique: true, nullable: true, name: 'email' })
  email: string | null;

  @Index()
  @Column({ type: String, unique: true, nullable: true, name: 'phone' })
  phone: string | null;

  @Column({ type: String, nullable: true, name: 'full_name' })
  fullName: string | null;

  @Column({ type: String, nullable: true, name: 'gender' })
  gender: GenderEnum | null;

  @Column({ type: String, nullable: true, name: 'password_hash' })
  passwordHash: string | null;

  @Column({
    type: String,
    default: RoleEnum.PATIENT,
    name: 'role',
  })
  role: RoleEnum;

  @Column({
    type: String,
    default: AccountStatus.ACTIVE,
    name: 'status',
  })
  status: AccountStatus;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'locked_at' })
  lockedAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'locked_reason' })
  lockedReason: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'locked_by' })
  lockedBy: string | null;

  @Column({ type: Boolean, default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: Boolean, default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string | null;
}
