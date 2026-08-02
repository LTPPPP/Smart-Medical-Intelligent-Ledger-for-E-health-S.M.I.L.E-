import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  SUSPENDED = 'SUSPENDED',
  // Soft-Deleted Account
  DEACTIVATED = 'DEACTIVATED',
}

export enum RoleEnum {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
  MANAGER = 'MANAGER',
}

/** ISO 5218 Gender Codes */
export enum GenderEnum {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

/** Canonical Gender Codes */
export const GENDER_VALUES: readonly number[] = [
  GenderEnum.UNKNOWN,
  GenderEnum.MALE,
  GenderEnum.FEMALE,
];

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

  @ApiProperty({
    enum: GENDER_VALUES,
    example: GenderEnum.MALE,
    nullable: true,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
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

