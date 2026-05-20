import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { SpecialtyEntity } from '../../specialties/entities/specialty.entity';

@Entity({ name: 'doctor_specialties' })
export class DoctorSpecialtyEntity {
  @PrimaryColumn({ type: 'uuid' })
  doctor_id: string;

  @PrimaryColumn({ type: 'uuid' })
  specialty_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certification_number: string | null;

  @Column({ type: 'date', nullable: true })
  certified_date: Date | null;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => SpecialtyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialty_id' })
  specialty: SpecialtyEntity;
}
