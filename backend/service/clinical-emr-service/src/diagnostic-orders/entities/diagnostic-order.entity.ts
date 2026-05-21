import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentEntity } from '../../appointments/entities/appointment.entity';

@Entity({ name: 'diagnostic_orders' })
export class DiagnosticOrderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  order_id: string;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  order_code: string;

  @Column({ type: 'varchar', length: 50 })
  order_type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: 'routine' })
  priority: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tooth_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area: string | null;

  @Column({ type: 'varchar', length: 20, default: 'ordered' })
  status: string;

  @Column({ type: 'text', nullable: true })
  result_summary: string | null;

  @Column({ type: 'text', nullable: true })
  result_attachment_url: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ordered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => AppointmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;
}
