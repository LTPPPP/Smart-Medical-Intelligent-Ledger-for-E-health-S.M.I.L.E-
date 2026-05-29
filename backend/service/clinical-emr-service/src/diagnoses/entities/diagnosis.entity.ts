import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExaminationSessionEntity } from '../../examination-sessions/entities/examination-session.entity';

/**
 * Loại chẩn đoán theo chuẩn bệnh án điện tử Thông tư 21/2017/TT-BYT
 */
export enum DiagnosisType {
  PRELIMINARY = 'preliminary', // Chẩn đoán sơ bộ
  DIFFERENTIAL = 'differential', // Chẩn đoán phân biệt
  CONFIRMED = 'confirmed', // Chẩn đoán xác định
  COMPLICATION = 'complication', // Biến chứng
}

export enum DiagnosisSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

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
  icd_code: string | null; // Mã ICD-10

  @Column({ type: 'varchar', length: 255 })
  diagnosis_name: string; // Tên chẩn đoán

  @Column({
    type: 'enum',
    enum: DiagnosisType,
    default: DiagnosisType.CONFIRMED,
  })
  diagnosis_type: DiagnosisType; // Loại chẩn đoán

  @Column({
    type: 'enum',
    enum: DiagnosisSeverity,
    nullable: true,
  })
  severity: DiagnosisSeverity | null; // Mức độ

  @Column({ type: 'text', nullable: true })
  basis_of_diagnosis: string | null; // Căn cứ chẩn đoán (lâm sàng / cận lâm sàng)

  @Column({ type: 'smallint', default: 1 })
  diagnosis_order: number; // Thứ tự ưu tiên (1 = chính, 2+ = kèm theo)

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
