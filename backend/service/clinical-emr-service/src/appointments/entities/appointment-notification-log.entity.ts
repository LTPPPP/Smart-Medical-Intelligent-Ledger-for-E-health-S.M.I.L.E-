import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';

import { NotificationChannel } from '../../utils/enums/notification-channel.enum';

@Entity({ name: 'appointment_notification_logs' })
@Index('idx_appointment_notification_logs_appointment', ['appointment_id'])
export class AppointmentNotificationLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'log_id' })
  log_id: string;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @ManyToOne(() => AppointmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;

  @Column({ type: 'varchar', length: 50 })
  notification_type: string;

  @Column({ type: 'varchar', length: 5, default: 'APP' })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'int', default: 0 })
  attempt_count: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  notification_id: string | null;

  @Column({ type: 'boolean', nullable: true })
  preference_enabled: boolean | null;

  @Column({ type: 'int', nullable: true })
  reminder_minutes_before: number | null;

  @Column({ type: 'timestamp', nullable: true })
  last_attempt_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  next_retry_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
