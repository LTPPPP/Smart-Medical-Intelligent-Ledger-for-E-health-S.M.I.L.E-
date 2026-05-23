import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'roles' })
export class RoleEntity {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  role_id: string;

  @ApiProperty({ example: 'DOCTOR' })
  @Column({ type: 'varchar', length: 50, unique: true })
  role_name: string;

  @ApiProperty({ example: 'Doctor role', nullable: true })
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
