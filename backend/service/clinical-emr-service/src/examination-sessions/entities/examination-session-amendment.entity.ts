import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExaminationSessionEntity } from './examination-session.entity';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';

@Entity({ name: 'examination_session_amendments' })
export class ExaminationSessionAmendmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'amendment_id' })
  amendment_id: string;

  @Index('idx_exam_amendments_session')
  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Index('idx_exam_amendments_record')
  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @ManyToOne(() => MedicalRecordEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity | null;

  @Index('idx_exam_amendments_patient')
  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  // Matches DB FK exam_amendments_patient_fkey (AddExamAmendmentPatientFk1784700000000)
  @ManyToOne(() => PatientEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity | null;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'text' })
  amendment_reason: string;

  @Column({ type: 'text' })
  amendment_text: string;

  @Column({ type: 'uuid' })
  amended_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
