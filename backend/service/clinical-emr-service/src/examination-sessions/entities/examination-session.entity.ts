import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';

export enum ExaminationSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'examination_sessions' })
export class ExaminationSessionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  session_id: string;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  // Snapshot of doctor/clinic names to keep form self-contained
  @Column({ type: 'varchar', length: 255, nullable: true })
  doctor_name_snapshot: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clinic_name_snapshot: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  session_date: Date;

  // --- Anamnesis / History ---
  @Column({ type: 'text', nullable: true })
  chief_complaint: string | null; // Lý do khám

  @Column({ type: 'text', nullable: true })
  present_illness: string | null; // Bệnh sử / Quá trình bệnh lý

  @Column({ type: 'text', nullable: true })
  family_history: string | null; // Tiền sử gia đình

  // Snapshot of allergies at visit time (denormalized from patient record)
  @Column({ type: 'jsonb', nullable: true })
  allergy_snapshot: string[] | null;

  // --- Physical Examination ---
  @Column({ type: 'text', nullable: true })
  physical_examination: string | null; // Khám thực thể

  @Column({ type: 'text', nullable: true })
  clinical_description: string | null; // Mô tả lâm sàng (narrative)

  // --- Vital Signs (typed columns for queryability) ---
  @Column({ type: 'smallint', nullable: true, comment: 'mmHg' })
  bp_systolic: number | null; // Huyết áp tâm thu

  @Column({ type: 'smallint', nullable: true, comment: 'mmHg' })
  bp_diastolic: number | null; // Huyết áp tâm trương

  @Column({ type: 'smallint', nullable: true, comment: 'bpm' })
  pulse_rate: number | null; // Mạch

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
    comment: '°C',
  })
  temperature_celsius: number | null; // Nhiệt độ

  @Column({ type: 'smallint', nullable: true, comment: '%' })
  spo2_percent: number | null; // SpO2

  @Column({ type: 'smallint', nullable: true, comment: 'breaths/min' })
  respiratory_rate: number | null; // Nhịp thở

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'kg',
  })
  weight_kg: number | null; // Cân nặng

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'cm',
  })
  height_cm: number | null; // Chiều cao

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 2,
    nullable: true,
    comment: 'kg/m²',
  })
  bmi: number | null; // BMI (tính tự động)

  // --- Follow-up ---
  @Column({ type: 'date', nullable: true })
  follow_up_date: Date | null; // Ngày tái khám

  @Column({ type: 'text', nullable: true })
  follow_up_notes: string | null; // Hướng dẫn tái khám

  // --- Data Protection (Nghị định 13/2023/NĐ-CP) ---
  @Column({ type: 'varchar', length: 50, nullable: true })
  data_consent_version: string | null; // Phiên bản consent bệnh nhân đã ký

  @Column({
    type: 'enum',
    enum: ExaminationSessionStatus,
    default: ExaminationSessionStatus.IN_PROGRESS,
  })
  status: ExaminationSessionStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
