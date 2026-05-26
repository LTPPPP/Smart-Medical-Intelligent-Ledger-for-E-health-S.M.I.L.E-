import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HandoffTicketStatus } from '../enums/agent-scheduling.enum';

@Entity({ name: 'handoff_tickets' })
export class HandoffTicketEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'handoff_ticket_id' })
  handoff_ticket_id: string;

  @Column({ type: 'varchar', length: 255 })
  session_id: string;

  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @Column({ type: 'varchar', length: 20 })
  risk_level: string;

  @Column({ type: 'text' })
  source_message: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'varchar', length: 20, default: HandoffTicketStatus.OPEN })
  status: HandoffTicketStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
