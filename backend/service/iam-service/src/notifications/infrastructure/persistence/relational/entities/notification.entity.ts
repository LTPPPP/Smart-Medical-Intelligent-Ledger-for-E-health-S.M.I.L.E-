import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { NotificationTemplateEntity } from './notification-template.entity';

@Entity({
  name: 'notifications',
})
export class NotificationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'notification_id' })
  notificationId: string;

  @Index()
  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => NotificationTemplateEntity, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: NotificationTemplateEntity;

  @Column({ name: 'notification_type', type: 'varchar', nullable: true })
  notificationType?: string;

  @Column({ name: 'channel', type: 'varchar' })
  channel: string;

  @Column({ name: 'subject', type: 'varchar', nullable: true })
  subject?: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'related_entity_id', type: 'varchar', nullable: true })
  relatedEntityId?: string;

  @Column({ name: 'related_entity_type', type: 'varchar', nullable: true })
  relatedEntityType?: string;

  @Index()
  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Index()
  @Column({ name: 'status', type: 'varchar', default: 'pending' })
  status: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
