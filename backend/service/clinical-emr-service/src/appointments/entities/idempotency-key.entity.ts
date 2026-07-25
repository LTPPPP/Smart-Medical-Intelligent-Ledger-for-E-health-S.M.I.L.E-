import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'idempotency_keys' })
export class IdempotencyKeyEntity {
  @PrimaryColumn({ type: 'varchar', length: 255, name: 'idempotency_key' })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 7 })
  method: string;

  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'varchar', length: 11, default: 'in_progress' })
  status: string;

  @Column({ type: 'int', nullable: true })
  response_status: number | null;

  @Column({ type: 'jsonb', nullable: true })
  response_body: unknown | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Index('idx_idempotency_expires')
  @Column({ type: 'timestamp' })
  expires_at: Date;
}
