import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';
import { RoomType } from '../../utils/enums/room-type.enum';

import { RoomStatus } from '../../utils/enums/room-status.enum';

@Entity({ name: 'treatment_rooms' })
@Unique(['clinic_id', 'room_code'])
export class TreatmentRoomEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'room_id' })
  room_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'varchar', length: 100 })
  room_name: string;

  @Column({ type: 'varchar', length: 50 })
  room_code: string;

  @Column({ type: 'enum', enum: RoomType, enumName: 'clinic_room_type' })
  room_type: RoomType;

  @Column({ type: 'int', nullable: true })
  floor_number: number | null;

  @Column({ type: 'jsonb', nullable: true })
  equipment_list: Record<string, any> | null;

  @Column({ type: 'varchar', length: 11, default: 'AVAILABLE' })
  status: RoomStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.treatment_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: ClinicEntity;
}
