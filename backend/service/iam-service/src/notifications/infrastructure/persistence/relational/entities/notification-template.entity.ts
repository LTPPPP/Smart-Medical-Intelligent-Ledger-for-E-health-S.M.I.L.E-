import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '@auth/utils/relational-entity-helper';

@Entity({
  name: 'notification_templates',
})
export class NotificationTemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid', { name: 'template_id' })
  templateId: string;

  @Index()
  @Column({ name: 'template_code', type: 'varchar', unique: true })
  templateCode: string;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'subject_template', type: 'text', nullable: true })
  subjectTemplate?: string;

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate: string;

  @Column({ name: 'channel', type: 'varchar' })
  channel: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
