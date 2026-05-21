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
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'treatment_plans' })
export class TreatmentPlanEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'plan_id' })
  plan_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  plan_name: string | null;

  @Column({ type: 'text', nullable: true })
  objectives: string | null;

  @Column({ type: 'int', nullable: true })
  duration_weeks: number | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  sent_to: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sent_via: string | null;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date | null;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
