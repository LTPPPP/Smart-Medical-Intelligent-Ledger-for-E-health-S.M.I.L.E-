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

@Entity({ name: 'pacs_sync_logs' })
export class PacsSyncLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sync_id' })
  sync_id: string;

  @Column({ type: 'uuid', nullable: true })
  image_id: string | null;

  @ManyToOne(() => DentalImageEntity) // DB FK is NO ACTION (create migration), not CASCADE
  @JoinColumn({ name: 'image_id' })
  image: DentalImageEntity;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sync_type: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pacs_server: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  synced_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
