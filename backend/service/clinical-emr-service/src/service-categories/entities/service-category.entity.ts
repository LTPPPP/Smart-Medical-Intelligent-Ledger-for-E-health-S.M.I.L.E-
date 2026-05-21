import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'service_categories' })
export class ServiceCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
  category_id: string;

  @Column({ type: 'varchar', length: 255 })
  category_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  parent_category_id: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  display_order: number | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ServiceCategoryEntity, (cat) => cat.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_category_id' })
  parent: ServiceCategoryEntity | null;

  @OneToMany(() => ServiceCategoryEntity, (cat) => cat.parent)
  children: ServiceCategoryEntity[];
}
