import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PrescriptionEntity } from '../../prescriptions/entities/prescription.entity';

@Entity({ name: 'prescription_items' })
export class PrescriptionItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  item_id: string;

  @Column({ type: 'uuid' })
  prescription_id: string;

  @ManyToOne(() => PrescriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: PrescriptionEntity;

  @Column({ type: 'varchar', length: 255 })
  medication_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  medication_code: string | null;

  @Column({ type: 'varchar', length: 100 })
  dosage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 100 })
  frequency: string;

  @Column({ type: 'int', nullable: true })
  duration_days: number | null;

  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
