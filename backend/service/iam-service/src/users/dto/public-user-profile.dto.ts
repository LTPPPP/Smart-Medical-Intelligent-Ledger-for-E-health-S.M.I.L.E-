import { ApiProperty } from '@nestjs/swagger';
import { UserProfileEntity } from '../entities/user-profile.entity';

/**
 * The only shape `GET /v1/user-profiles/:id` may return, because that route is
 * reachable without authentication (the booking assistant resolves doctor
 * display names through it). Contact details, date of birth, ban metadata and
 * audit columns must never appear here.
 */
export class PublicUserProfileDto {
  @ApiProperty({ example: 'uuid' })
  user_id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  full_name: string;

  @ApiProperty({ nullable: true })
  avatar_url: string | null;

  static fromEntity(entity: UserProfileEntity): PublicUserProfileDto {
    return {
      user_id: entity.user_id,
      full_name: entity.full_name,
      avatar_url: entity.avatar_url,
    };
  }
}
