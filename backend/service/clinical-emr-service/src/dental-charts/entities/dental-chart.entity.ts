import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'dental_charts' })
@Unique(['record_id', 'tooth_number'])
export class DentalChartEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'chart_id' })
  chart_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid' })
  record_id: string;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'int' })
  tooth_number: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tooth_status: string | null;

  @Column({ type: 'jsonb', nullable: true })
  surfaces: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
