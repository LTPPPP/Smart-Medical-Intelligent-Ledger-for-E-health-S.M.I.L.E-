import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';

@Entity({ name: 'diagnoses' })
export class DiagnosisEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'diagnosis_id' })
  diagnosis_id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Column({ type: 'varchar', length: 20, nullable: true })
  icd_code: string | null;

  @Column({ type: 'varchar', length: 255 })
  diagnosis_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  diagnosis_type: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  severity: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
