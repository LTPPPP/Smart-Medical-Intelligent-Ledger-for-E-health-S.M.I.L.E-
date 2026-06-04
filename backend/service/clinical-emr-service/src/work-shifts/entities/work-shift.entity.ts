import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'work_shifts' })
export class WorkShiftEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'shift_id' })
  shift_id: string;

  @Column({ type: 'varchar', length: 100 })
  shift_name: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
