import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';

import { Severity } from '../../utils/enums/severity.enum';

@Entity({ name: 'symptoms' })
export class SymptomEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'symptom_id' })
  symptom_id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @ManyToOne(() => PatientEntity) // No Action Fk
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  symptom_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  body_location: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  severity: Severity | null;

  @Column({ type: 'date', nullable: true })
  onset_date: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid' })
  recorded_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
