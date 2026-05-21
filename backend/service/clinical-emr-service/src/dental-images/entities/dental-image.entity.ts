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
import { MedicalRecordEntity } from '../../medical-records/entities/medical-record.entity';
import { ImageCategoryEntity } from '../../image-categories/entities/image-category.entity';

@Entity({ name: 'dental_images' })
export class DentalImageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  image_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @ManyToOne(() => MedicalRecordEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: MedicalRecordEntity;

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @ManyToOne(() => ImageCategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ImageCategoryEntity;

  @Column({ type: 'varchar', length: 50 })
  image_type: string;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'int', nullable: true })
  file_size_kb: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  file_format: string | null;

  @Column({ type: 'int', array: true, nullable: true })
  tooth_numbers: number[] | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  view_angle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pacs_id: string | null;

  @Column({ type: 'date', nullable: true })
  taken_date: Date | null;

  @Column({ type: 'uuid', nullable: true })
  taken_by: string | null;

  @Column({ type: 'uuid' })
  uploaded_by: string;

  @Column({ type: 'boolean', default: false })
  is_archived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
