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
 * Mức độ khẩn cấp giấy chuyển viện
 */
export enum ReferralUrgency {
  ROUTINE = 'routine', // Thường
  URGENT = 'urgent', // Khẩn
  EMERGENCY = 'emergency', // Cấp cứu
}

export enum ReferralStatus {
  PENDING = 'pending', // Chờ xác nhận
  ACCEPTED = 'accepted', // Đã tiếp nhận
  REJECTED = 'rejected', // Từ chối
  COMPLETED = 'completed', // Đã hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
}

@Entity({ name: 'referrals' })
export class ReferralEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'referral_id' })
  referral_id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ExaminationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ExaminationSessionEntity;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  // Cơ sở chuyển đi
  @Column({ type: 'uuid' })
  from_clinic_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  from_clinic_name_snapshot: string | null;

  // Cơ sở nhận
  @Column({ type: 'varchar', length: 255 })
  to_facility_name: string; // Tên cơ sở y tế tiếp nhận

  @Column({ type: 'varchar', length: 255, nullable: true })
  to_facility_address: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  to_department: string | null; // Khoa tiếp nhận

  @Column({ type: 'varchar', length: 255, nullable: true })
  to_doctor_name: string | null; // Bác sĩ tiếp nhận (nếu biết)

  @Column({ type: 'text' })
  referral_reason: string; // Lý do chuyển viện

  @Column({ type: 'text', nullable: true })
  clinical_summary: string | null; // Tóm tắt bệnh án gửi kèm

  @Column({ type: 'jsonb', nullable: true })
  accompanying_documents: string[] | null; // Danh sách tài liệu đính kèm (URLs)

  @Column({
    type: 'enum',
    enum: ReferralUrgency,
    default: ReferralUrgency.ROUTINE,
  })
  urgency: ReferralUrgency; // Mức độ khẩn cấp

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  // Bác sĩ ký giấy chuyển viện
  @Column({ type: 'uuid' })
  issued_by: string; // doctor_id

  @Column({ type: 'varchar', length: 255, nullable: true })
  issued_by_name_snapshot: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issued_at: Date; // Ngày cấp giấy chuyển viện

  @Column({ type: 'timestamp', nullable: true })
  valid_until: Date | null; // Giấy có hiệu lực đến

  @Column({ type: 'uuid', nullable: true })
  accepted_by: string | null; // UUID bác sĩ tiếp nhận (nếu trong hệ thống)

  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
