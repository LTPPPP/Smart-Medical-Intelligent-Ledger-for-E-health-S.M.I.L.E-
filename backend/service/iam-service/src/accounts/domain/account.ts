import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  SUSPENDED = 'SUSPENDED',
}

export enum RoleEnum {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class Account {
  @ApiProperty({ type: String })
  @Expose()
  accountId: string;

  @ApiProperty({ type: String, example: 'johndoe' })
  @Expose()
  username: string | null;

  @ApiProperty({ type: String, example: 'john@example.com', nullable: true })
  @Expose()
  email: string | null;

  @ApiProperty({ type: String, example: '+1234567890' })
  @Expose()
  phone: string | null;

  @ApiProperty({ type: String, example: 'Nguyễn Văn A', nullable: true })
  @Expose()
  fullName: string | null;

  @ApiProperty({ enum: GenderEnum, nullable: true })
  @Expose()
  gender: GenderEnum | null;

  @Expose({ toPlainOnly: true })
  passwordHash?: string;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.PATIENT })
  @Expose()
  role: RoleEnum;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  @Expose()
  status: AccountStatus;

  @ApiProperty({ type: Number, example: 0 })
  @Expose()
  failedLoginAttempts: number;

  @ApiProperty({ type: Date })
  @Expose()
  lockedAt: Date | null;

  @ApiProperty({ type: String })
  @Expose()
  lockedReason: string | null;

  @ApiProperty({ type: String })
  @Expose()
  lockedBy: string | null;

  @ApiProperty({ type: Boolean, example: false })
  @Expose()
  emailVerified: boolean;

  @ApiProperty({ type: Boolean, example: false })
  @Expose()
  phoneVerified: boolean;

  @ApiProperty({ type: Date })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({ type: Date })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: String })
  @Expose()
  createdBy: string | null;

  @ApiProperty({ type: String })
  @Expose()
  updatedBy: string | null;
}

