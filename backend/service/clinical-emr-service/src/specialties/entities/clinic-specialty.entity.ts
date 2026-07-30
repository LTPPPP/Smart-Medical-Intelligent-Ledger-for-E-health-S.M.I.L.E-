import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';
import { SpecialtyEntity } from './specialty.entity';

// Clinic-specialty mapping
@Entity({ name: 'clinic_specialties' })
export class ClinicSpecialtyEntity {
  @PrimaryColumn({ type: 'uuid' })
  clinic_id: string;

  @PrimaryColumn({ type: 'uuid' })
  specialty_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ClinicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;

  @ManyToOne(() => SpecialtyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialty_id' })
  specialty: SpecialtyEntity;
}
