import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'user_roles' })
export class UserRoleEntity {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ example: 'uuid' })
  @Column({ type: 'uuid' })
  role_id: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'assigned_at' })
  assigned_at: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assigned_by: string | null;
}
