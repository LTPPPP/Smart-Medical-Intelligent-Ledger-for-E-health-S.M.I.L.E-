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

  @ManyToOne(() => MedicalRecordEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity | null;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

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
