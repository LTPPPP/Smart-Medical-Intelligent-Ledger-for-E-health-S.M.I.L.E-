import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';

@Entity({ name: 'patient_representatives' })
@Index('idx_patient_representatives_patient', ['patient_id'])
export class PatientRepresentativeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'representative_id' })
  representative_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 100 })
  relationship: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  legal_document_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  legal_document_number: string | null;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  authorized_for_treatment: boolean;

  @Column({ type: 'boolean', default: false })
  authorized_for_payment: boolean;

  @Column({ type: 'boolean', default: false })
  authorized_for_records: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
