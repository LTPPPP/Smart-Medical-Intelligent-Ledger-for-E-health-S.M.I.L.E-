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
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';

@Entity({ name: 'clinical_orders' })
export class ClinicalOrderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  order_id: string;

  @Column({ type: 'uuid', nullable: true })
  session_id: string | null;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid' })
  ordered_by: string;

  @Column({ type: 'varchar', length: 13 })
  order_type: string;

  @Column({ type: 'varchar', length: 100 })
  test_type: string;

  @Column({ type: 'text', nullable: true })
  clinical_indication: string | null;

  @Column({ type: 'int', array: true, nullable: true })
  teeth_numbers: number[] | null;

  @Column({ type: 'varchar', length: 7, default: 'routine' })
  urgency: string;

  @Column({ type: 'varchar', length: 11, default: 'ordered' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ordered_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_date: Date | null;

  @Column({ type: 'text', nullable: true })
  result_url: string | null;

  @Column({ type: 'text', nullable: true })
  report: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
