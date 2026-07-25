import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class UserProfileEntity {
  @ApiProperty({ example: 'uuid' })
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @ApiProperty({ example: 'user@smile.com', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @ApiProperty({ example: '+84901234567', nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @ApiProperty({ example: '1990-01-01', nullable: true })
  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @Column({ type: 'smallint', nullable: true })
  gender: number | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

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

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false, name: 'is_banned' })
  is_banned: boolean;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'banned_at' })
  banned_at: Date | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'ban_reason' })
  ban_reason: string | null;
}
