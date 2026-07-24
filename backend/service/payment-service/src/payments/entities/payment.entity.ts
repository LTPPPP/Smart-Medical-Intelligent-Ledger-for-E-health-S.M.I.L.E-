import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  payment_id: string;

  @Index()
  @Column({ type: 'uuid' })
  appointment_id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  // pending / paid / failed / refunded
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 30, default: 'vnpay' })
  provider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_txn_ref: string | null;

  @Column({ type: 'text', nullable: true })
  order_info: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  refund_amount: number | null;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date | null;

  // ── Refund approval workflow ──────────────────────────────────────────────
  // null → no refund activity. Otherwise:
  // REQUESTED → UNDER_REVIEW → APPROVED → REFUNDING → REFUNDED | REJECTED
  @Column({ type: 'varchar', length: 20, nullable: true })
  refund_status: string | null;

  @Column({ type: 'text', nullable: true })
  refund_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  refund_requested_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refund_requested_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  refund_reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refund_reviewed_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
