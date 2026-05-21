import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';

@Entity({ name: 'medical_record_versions' })
export class MedicalRecordVersionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'version_id' })
  version_id: string;

  @Column({ type: 'uuid' })
  record_id: string;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'int' })
  version_number: number;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ type: 'uuid' })
  changed_by: string;

  @Column({ type: 'text', nullable: true })
  change_reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
