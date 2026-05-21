import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';

@Entity({ name: 'appointment_status_history' })
export class AppointmentStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  old_status: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  new_status: string | null;

  @Column({ type: 'uuid' })
  changed_by: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => AppointmentEntity, (a) => a.status_history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;
}
