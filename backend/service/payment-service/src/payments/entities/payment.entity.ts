import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Currency, PaymentStatus } from '../payment-status.enum';
import { RefundStatus } from '../refund-status.enum';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  payment_id: string;

  @Index()
  @Column({ type: 'uuid' })
  appointment_id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'char', length: 3, default: 'VND' })
  currency: Currency;

  // Status Values
  @Column({ type: 'varchar', length: 8, default: 'pending' })
  status: PaymentStatus;

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

  // Refund Workflow States
  @Column({ type: 'varchar', length: 12, nullable: true })
  refund_status: RefundStatus | null;

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
