import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';

@Entity({ name: 'treatment_history' })
export class TreatmentHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'treatment_id' })
  treatment_id: string;

  @Column({ type: 'uuid' })
  record_id: string;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'date' })
  treatment_date: Date;

  @Column({ type: 'int', array: true, nullable: true })
  tooth_numbers: number[] | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  procedure_code: string | null;

  @Column({ type: 'varchar', length: 255 })
  procedure_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number | null;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: string;

  @Column({ type: 'uuid' })
  performed_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
