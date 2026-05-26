import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WaitlistEntryStatus } from '../enums/agent-scheduling.enum';

@Entity({ name: 'waitlist_entries' })
@Index(['clinic_id', 'service_id', 'preferred_date', 'status'])
export class WaitlistEntryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'waitlist_entry_id' })
  waitlist_entry_id: string;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  patient_name: string;

  @Column({ type: 'varchar', length: 20 })
  patient_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  patient_email: string | null;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'uuid', nullable: true })
  doctor_id: string | null;

  @Column({ type: 'date' })
  preferred_date: Date;

  @Column({ type: 'time', nullable: true })
  preferred_start_time: string | null;

  @Column({ type: 'time', nullable: true })
  preferred_end_time: string | null;

  @Column({ type: 'varchar', length: 20, default: WaitlistEntryStatus.ACTIVE })
  status: WaitlistEntryStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
