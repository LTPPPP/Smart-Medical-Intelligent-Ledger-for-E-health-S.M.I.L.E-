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

@Entity({ name: 'medical_history' })
export class MedicalHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  condition_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition_type: string | null;

  @Column({ type: 'date', nullable: true })
  diagnosed_date: Date | null;

  @Column({ type: 'text', nullable: true })
  treatment: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
