import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { NotificationChannel } from '../../utils/enums/notification-channel.enum';

@Entity({ name: 'appointment_reminder_preferences' })
// Matches the DB UNIQUE CONSTRAINT created by AppointmentReminderTracking1730000000005
// (was previously declared as a unique @Index with a different name, which made
// migration:generate propose a duplicate index).
@Unique('uq_reminder_preferences_patient_channel', ['patient_id', 'channel'])
export class AppointmentReminderPreferenceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'preference_id' })
  preference_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'varchar', length: 5, default: 'APP' })
  channel: NotificationChannel;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 1440 })
  reminder_minutes_before: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
