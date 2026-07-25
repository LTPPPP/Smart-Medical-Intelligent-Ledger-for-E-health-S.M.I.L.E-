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
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';
import { PrescriptionItemEntity } from '../../prescription-items/entities/prescription-item.entity';

import { PrescriptionStatus } from '../../utils/enums/prescription-status.enum';

@Entity({ name: 'prescriptions' })
export class PrescriptionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'prescription_id' })
  prescription_id: string;

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
  doctor_id: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  prescription_date: Date;

  @Column({ type: 'varchar', length: 9, default: 'draft' })
  status: PrescriptionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  digital_signature_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  issued_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  issued_by: string | null;

  @Column({ type: 'boolean', nullable: true })
  minor_patient_at_issue: boolean | null;

  @Column({ type: 'int', nullable: true })
  patient_age_years_at_issue: number | null;

  @Column({ type: 'int', nullable: true })
  patient_age_months_at_issue: number | null;

  @Column({ type: 'uuid', nullable: true })
  representative_id_snapshot: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  representative_name_snapshot: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  representative_relationship_snapshot: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  representative_phone_snapshot: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @OneToMany(() => PrescriptionItemEntity, (item) => item.prescription)
  items: PrescriptionItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
