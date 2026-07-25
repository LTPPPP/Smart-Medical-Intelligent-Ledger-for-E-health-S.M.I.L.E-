import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TreatmentRoomEntity } from '../../treatment-rooms/entities/treatment-room.entity';

import { ClinicStatus } from '../../utils/enums/clinic-status.enum';

@Entity({ name: 'clinics' })
export class ClinicEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'clinic_id' })
  clinic_id: string;

  @Column({ type: 'varchar', length: 255 })
  clinic_name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  clinic_code: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  logo_url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  operating_hours: Record<string, string> | null;

  @Column({ type: 'varchar', length: 11, default: 'ACTIVE' })
  status: ClinicStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  license_number: string | null;

  @Column({ type: 'date', nullable: true })
  license_expiry: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => TreatmentRoomEntity, (room) => room.clinic)
  treatment_rooms: TreatmentRoomEntity[];
}
