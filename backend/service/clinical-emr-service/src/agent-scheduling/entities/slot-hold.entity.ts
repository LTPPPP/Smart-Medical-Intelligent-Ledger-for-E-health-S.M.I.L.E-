import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlotHoldStatus } from '../enums/agent-scheduling.enum';

@Entity({ name: 'slot_holds' })
@Index(['slot_id', 'status'])
@Index(['patient_session_id', 'status'])
export class SlotHoldEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'hold_id' })
  hold_id: string;

  @Column({ type: 'uuid' })
  slot_id: string;

  @Column({ type: 'varchar', length: 255 })
  patient_session_id: string;

  @Column({ type: 'varchar', length: 20, default: SlotHoldStatus.ACTIVE })
  status: SlotHoldStatus;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  released_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
