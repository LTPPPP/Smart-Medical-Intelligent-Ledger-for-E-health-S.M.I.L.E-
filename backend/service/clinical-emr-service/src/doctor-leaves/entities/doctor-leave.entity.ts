import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApprovalStatus } from '../../utils/enums/approval-status.enum';
import { LeaveType } from '../../utils/enums/leave-type.enum';

@Entity({ name: 'doctor_leaves' })
export class DoctorLeaveEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'leave_id' })
  leave_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  leave_type: LeaveType | null;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 8, default: 'pending' })
  status: ApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
