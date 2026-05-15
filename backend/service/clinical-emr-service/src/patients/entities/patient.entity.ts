import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'patients' })
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'patient_id' })
  patient_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  patient_code: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergency_contact: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergency_phone: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  blood_type: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  allergies: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  chronic_diseases: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insurance_provider: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
