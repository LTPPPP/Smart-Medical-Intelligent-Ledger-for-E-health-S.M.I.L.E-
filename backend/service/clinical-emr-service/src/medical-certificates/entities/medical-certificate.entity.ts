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

/**
 * Loại giấy chứng nhận y tế
 * Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
 * và Thông tư 21/2017/TT-BYT về bệnh án điện tử
 */
export enum MedicalCertificateType {
  SICK_LEAVE = 'sick_leave', // Giấy nghỉ ốm (BHXH)
  FITNESS = 'fitness', // Giấy chứng nhận sức khỏe
  DISABILITY = 'disability', // Giấy chứng nhận khuyết tật
  MATERNITY = 'maternity', // Giấy chứng nhận thai sản
  ADMISSION = 'admission', // Giấy nhập viện
}

export enum MedicalCertificateStatus {
  ISSUED = 'issued',
  VOIDED = 'voided',
  EXPIRED = 'expired',
}

@Entity({ name: 'medical_certificates' })
export class MedicalCertificateEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cert_id' })
  cert_id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({
    type: 'enum',
    enum: MedicalCertificateType,
    default: MedicalCertificateType.SICK_LEAVE,
  })
  cert_type: MedicalCertificateType; // Loại giấy chứng nhận

  @Column({ type: 'date' })
  issued_date: Date; // Ngày cấp

  @Column({ type: 'date', nullable: true })
  valid_from: Date | null; // Ngày bắt đầu nghỉ

  @Column({ type: 'date', nullable: true })
  valid_to: Date | null; // Ngày kết thúc nghỉ

  @Column({ type: 'smallint', nullable: true })
  days_granted: number | null; // Số ngày nghỉ

  @Column({ type: 'text', nullable: true })
  reason: string | null; // Lý do nghỉ / chứng nhận

  @Column({ type: 'text', nullable: true })
  restrictions: string | null; // Hạn chế / lưu ý

  // Thông tin bác sĩ ký (denormalized theo Nghị định 13/2023)
  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  doctor_name_snapshot: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  doctor_license_number: string | null; // Số chứng chỉ hành nghề

  @Column({ type: 'uuid', nullable: true })
  doctor_signature_id: string | null; // Chữ ký số

  @Column({
    type: 'enum',
    enum: MedicalCertificateStatus,
    default: MedicalCertificateStatus.ISSUED,
  })
  status: MedicalCertificateStatus;

  @Column({ type: 'text', nullable: true })
  void_reason: string | null; // Lý do hủy (nếu voided)

  @Column({ type: 'uuid', nullable: true })
  voided_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  voided_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
