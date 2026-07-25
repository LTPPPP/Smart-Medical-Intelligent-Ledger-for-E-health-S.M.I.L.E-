import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DoctorScheduleEntity } from './doctor-schedule.entity';

import { ApprovalStatus } from '../../utils/enums/approval-status.enum';
import { ChangeType } from '../../utils/enums/change-type.enum';

@Entity({ name: 'schedule_changes' })
export class ScheduleChangeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'change_id' })
  change_id: string;

  @Column({ type: 'uuid' })
  schedule_id: string;

  @Column({ type: 'uuid' })
  changed_by: string;

  @Column({ type: 'varchar', length: 14 })
  change_type: ChangeType;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'varchar', length: 8, default: 'pending' })
  approval_status: ApprovalStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => DoctorScheduleEntity, (schedule) => schedule.changes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: DoctorScheduleEntity;
}
