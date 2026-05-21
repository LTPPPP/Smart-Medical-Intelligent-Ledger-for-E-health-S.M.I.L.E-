import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';
import { TreatmentRoomEntity } from '../../treatment-rooms/entities/treatment-room.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { AppointmentStatusHistoryEntity } from './appointment-status-history.entity';

@Entity({ name: 'appointments' })
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'appointment_id' })
  appointment_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  appointment_code: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', nullable: true })
  room_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  service_id: string | null;

  @Column({ type: 'date' })
  appointment_date: Date;

  @Column({ type: 'time' })
  appointment_time: string;

  @Column({ type: 'int', default: 30 })
  duration_minutes: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  appointment_type: string | null;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: string;

  @Column({ type: 'text', nullable: true })
  chief_complaint: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  // UC-051: Outside business hours
  @Column({ type: 'boolean', default: false })
  is_outside_hours: boolean;

  @Column({ type: 'text', nullable: true })
  outside_hours_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  // Payment reference
  @Column({ type: 'uuid', nullable: true })
  payment_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'unpaid' })
  payment_status: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ClinicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;

  @ManyToOne(() => TreatmentRoomEntity, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: TreatmentRoomEntity | null;

  @ManyToOne(() => ServiceEntity, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @OneToMany(() => AppointmentStatusHistoryEntity, (h) => h.appointment)
  status_history: AppointmentStatusHistoryEntity[];
}
