import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';
import { WorkShiftEntity } from '../../work-shifts/entities/work-shift.entity';
import { TreatmentRoomEntity } from '../../treatment-rooms/entities/treatment-room.entity';
import { ScheduleChangeEntity } from './schedule-change.entity';

@Entity({ name: 'doctor_schedules' })
@Unique(['doctor_id', 'work_date', 'shift_id'])
export class DoctorScheduleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'schedule_id' })
  schedule_id: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id: string | null;

  @Column({ type: 'date' })
  work_date: Date;

  @Column({ type: 'uuid', nullable: true })
  room_id: string | null;

  @Column({ type: 'int', default: 20 })
  max_patients: number;

  @Column({ type: 'varchar', length: 9, default: 'scheduled' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => ClinicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;

  @ManyToOne(() => WorkShiftEntity, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: WorkShiftEntity | null;

  @ManyToOne(() => TreatmentRoomEntity, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: TreatmentRoomEntity | null;

  @OneToMany(() => ScheduleChangeEntity, (change) => change.schedule)
  changes: ScheduleChangeEntity[];
}
