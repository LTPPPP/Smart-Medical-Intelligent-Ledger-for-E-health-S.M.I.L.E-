import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceCategoryEntity } from '../../service-categories/entities/service-category.entity';
import { SpecialtyEntity } from '../../specialties/entities/specialty.entity';
import { RoomType } from '../../utils/enums/room-type.enum';

@Entity({ name: 'services' })
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'service_id' })
  service_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  service_code: string;

  @Column({ type: 'varchar', length: 255 })
  service_name: string;

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  specialty_id: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 30 })
  duration_minutes: number;

  @Column({ type: 'enum', enum: RoomType, enumName: 'clinic_room_type' })
  required_room_type: RoomType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  base_price: number | null;

  @Column({ type: 'char', length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: true })
  requires_appointment: boolean;

  @Column({ type: 'text', nullable: true })
  preparation_instructions: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => ServiceCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategoryEntity | null;

  @ManyToOne(() => SpecialtyEntity, { nullable: true })
  @JoinColumn({ name: 'specialty_id' })
  specialty: SpecialtyEntity | null;
}
