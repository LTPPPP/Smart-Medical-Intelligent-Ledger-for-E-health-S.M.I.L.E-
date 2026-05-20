import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClinicalOrderEntity } from '../../clinical-orders/entities/clinical-order.entity';

@Entity({ name: 'lab_test_results' })
export class LabTestResultEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'result_id' })
  result_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => ClinicalOrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ClinicalOrderEntity;

  @Column({ type: 'varchar', length: 255 })
  test_name: string;

  @Column({ type: 'text', nullable: true })
  result_value: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  result_unit: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_range: string | null;

  @Column({ type: 'boolean', default: false })
  is_abnormal: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
