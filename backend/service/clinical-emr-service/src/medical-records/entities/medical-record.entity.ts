import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';

@Entity({ name: 'medical_records' })
export class MedicalRecordEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'record_id' })
  record_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid', nullable: true })
  appointment_id: string | null;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'date' })
  visit_date: Date;

  @Column({ type: 'text', nullable: true })
  chief_complaint: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  treatment_plan: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 9, default: 'draft' })
  record_status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  record_hash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  finalized_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  finalized_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
