import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'doctor_leaves' })
export class DoctorLeaveEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'leave_id' })
  leave_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  leave_type: string | null;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
