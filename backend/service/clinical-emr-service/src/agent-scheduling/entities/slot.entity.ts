import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlotStatus } from '../enums/agent-scheduling.enum';

@Entity({ name: 'slots' })
@Index(['clinic_id', 'slot_date', 'start_time'])
@Index(['doctor_id', 'slot_date', 'start_time'])
export class SlotEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'slot_id' })
  slot_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', nullable: true })
  doctor_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  room_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  service_id: string | null;

  @Column({ type: 'date' })
  slot_date: Date;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'int', default: 30 })
  duration_minutes: number;

  @Column({ type: 'varchar', length: 20, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  held_by_session_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  hold_expires_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  appointment_id: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
