import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @ApiProperty({ example: 'LOGIN' })
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @ApiProperty({ example: 'auth' })
  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  resource_id: string | null;

  @ApiProperty({ example: '127.0.0.1', nullable: true })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
