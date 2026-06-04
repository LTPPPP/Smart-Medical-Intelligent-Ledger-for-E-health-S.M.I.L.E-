import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'permissions' })
export class PermissionEntity {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  permission_id: string;

  @ApiProperty({ example: 'patient.record.read' })
  @Column({ type: 'varchar', length: 100, unique: true })
  permission_name: string;

  @ApiProperty({ example: 'medical_record', description: 'Resource this permission targets (e.g. user, role, appointment, medical_record)', nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  resource: string | null;

  @ApiProperty({ example: 'read', description: 'Action allowed on the resource (e.g. create, read, update, delete, cancel, manage)', nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  action: string | null;

  @ApiProperty({ example: 'Read patient medical records', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updated_by: string | null;
}
