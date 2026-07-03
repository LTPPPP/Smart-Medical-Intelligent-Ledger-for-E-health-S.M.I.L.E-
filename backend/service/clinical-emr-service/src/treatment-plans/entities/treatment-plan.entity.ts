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
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';

@Entity({ name: 'treatment_plans' })
export class TreatmentPlanEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'plan_id' })
  plan_id: string;

  @Column({ type: 'uuid', nullable: true })
  session_id: string | null;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

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

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimated_cost: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  quote_currency: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  quote_version: string | null;

  @Column({ type: 'text', nullable: true })
  risk_disclosure: string | null;

  @Column({ type: 'text', nullable: true })
  alternative_options: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  sent_to: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sent_via: string | null;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  proposed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  accepted_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  declined_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  declined_by: string | null;

  @Column({ type: 'text', nullable: true })
  decline_reason: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  acceptance_scope: string | null;

  @Column({ type: 'text', nullable: true })
  accepted_scope_note: string | null;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
