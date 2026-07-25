import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';

import { NotificationChannel } from '@auth/notifications/domain/notification-template';

@Entity({
  name: 'notification_preferences',
})
export class NotificationPreferenceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'preference_id' })
  preferenceId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 50 })
  notificationType: string;

  @Column({ name: 'channel', type: 'varchar', length: 5 })
  channel: NotificationChannel;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
