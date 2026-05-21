import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'record_exports' })
export class RecordExportEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'export_id' })
  export_id: string;

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  export_type: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  export_format: string | null;

  @Column({ type: 'text', nullable: true })
  file_url: string | null;

  @Column({ type: 'uuid' })
  exported_by: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
