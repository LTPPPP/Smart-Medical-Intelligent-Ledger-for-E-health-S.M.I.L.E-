import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { HistoryTypeEnum } from '../enums/history-type.enum';
import { SeverityEnum } from '../enums/severity.enum';

@Entity({ name: 'medical_history' })
export class MedicalHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  condition_name: string;

  @Column({
    type: 'enum',
    enum: HistoryTypeEnum,
    default: HistoryTypeEnum.OTHER,
  })
  condition_type: HistoryTypeEnum;

  @Column({ type: 'date', nullable: true })
  diagnosed_date: Date | null;

  @Column({ type: 'date', nullable: true })
  resolution_date: Date | null;

  @Column({
    type: 'enum',
    enum: SeverityEnum,
    nullable: true,
  })
  severity: SeverityEnum | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  treatment: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
