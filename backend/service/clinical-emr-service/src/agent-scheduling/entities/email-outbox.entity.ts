import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EmailOutboxStatus,
  NotificationType,
} from '../enums/agent-scheduling.enum';

@Entity({ name: 'email_outbox' })
export class EmailOutboxEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'email_outbox_id' })
  email_outbox_id: string;

  @Column({ type: 'varchar', length: 80 })
  notification_type: NotificationType;

  @Column({ type: 'varchar', length: 40 })
  recipient_type: string;

  @Column({ type: 'varchar', length: 255 })
  recipient_email: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  template_data: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: EmailOutboxStatus.QUEUED })
  status: EmailOutboxStatus;

  @Column({ type: 'text', nullable: true })
  last_error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
