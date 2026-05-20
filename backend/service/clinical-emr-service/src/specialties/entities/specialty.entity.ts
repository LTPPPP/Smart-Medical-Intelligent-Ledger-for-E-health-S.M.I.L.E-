import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'specialties' })
export class SpecialtyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'specialty_id' })
  specialty_id: string;

  @Column({ type: 'varchar', length: 255 })
  specialty_name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  specialty_code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  icon_url: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  display_order: number | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
