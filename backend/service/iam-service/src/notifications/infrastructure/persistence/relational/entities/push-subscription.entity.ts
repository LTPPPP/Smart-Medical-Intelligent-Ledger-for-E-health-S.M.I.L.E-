import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';

@Entity({
  name: 'notification_push_subscriptions',
})
export class PushSubscriptionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'subscription_id' })
  subscriptionId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'endpoint', type: 'text', unique: true })
  endpoint: string;

  @Column({ name: 'p256dh', type: 'varchar', length: 255 })
  p256dh: string;

  @Column({ name: 'auth', type: 'varchar', length: 255 })
  auth: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
