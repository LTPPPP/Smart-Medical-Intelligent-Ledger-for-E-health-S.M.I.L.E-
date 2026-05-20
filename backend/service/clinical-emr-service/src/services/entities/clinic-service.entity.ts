import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'clinic_services' })
@Unique(['clinic_id', 'service_id'])
export class ClinicServiceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'clinic_service_id' })
  clinic_service_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  custom_price: number | null;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => ClinicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;

  @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;
}
