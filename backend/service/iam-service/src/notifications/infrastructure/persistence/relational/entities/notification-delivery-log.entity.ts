import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';
import { NotificationEntity } from './notification.entity';

@Entity({
  name: 'notification_delivery_logs',
})
export class NotificationDeliveryLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'log_id' })
  logId: string;

  @Index()
  @Column({ name: 'notification_id', type: 'uuid', nullable: true })
  notificationId?: string;

  @ManyToOne(() => NotificationEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification?: NotificationEntity;

  @Column({ name: 'gateway_name', type: 'varchar', length: 100, nullable: true })
  gatewayName?: string;

  @Column({ name: 'gateway_response_id', type: 'varchar', length: 255, nullable: true })
  gatewayResponseId?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, nullable: true })
  status?: string;

  @Column({ name: 'error_payload', type: 'jsonb', nullable: true })
  errorPayload?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
