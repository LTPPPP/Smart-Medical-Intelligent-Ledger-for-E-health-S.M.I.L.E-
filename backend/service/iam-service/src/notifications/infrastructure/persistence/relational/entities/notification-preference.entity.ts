import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';

@Entity({
  name: 'notification_preferences',
})
export class NotificationPreferenceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'preference_id' })
  preferenceId: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ name: 'notification_type', type: 'varchar' })
  notificationType: string;

  @Column({ name: 'channel', type: 'varchar' })
  channel: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
