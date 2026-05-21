import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DentalImageEntity } from '../../dental-images/entities/dental-image.entity';

@Entity({ name: 'image_annotations' })
export class ImageAnnotationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'annotation_id' })
  annotation_id: string;

  @Column({ type: 'uuid' })
  image_id: string;

  @ManyToOne(() => DentalImageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image: DentalImageEntity;

  @Column({ type: 'uuid' })
  annotated_by: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  annotation_type: string | null;

  @Column({ type: 'jsonb', nullable: true })
  annotation_data: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
