import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'image_categories' })
export class ImageCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
  category_id: string;

  @Column({ type: 'varchar', length: 100 })
  category_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
