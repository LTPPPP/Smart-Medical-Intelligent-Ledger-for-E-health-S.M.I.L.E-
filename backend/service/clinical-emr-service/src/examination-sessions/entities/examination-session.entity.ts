import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'examination_sessions' })
export class ExaminationSessionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  session_id: string;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  session_date: Date;

  @Column({ type: 'text', nullable: true })
  chief_complaint: string | null;

  @Column({ type: 'text', nullable: true })
  present_illness: string | null;

  @Column({ type: 'text', nullable: true })
  physical_examination: string | null;

  @Column({ type: 'jsonb', nullable: true })
  vital_signs: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'in_progress' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
