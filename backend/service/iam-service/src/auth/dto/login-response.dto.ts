import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../accounts/domain/account';
import { UserProfileEntity } from '../../users/entities/user-profile.entity';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: number;

  @ApiProperty({
    type: () => Account,
  })
  user: Account;

  @ApiProperty({
    type: () => UserProfileEntity,
    nullable: true,
    description: 'User profile from users table (linked by account_id = user_id)',
  })
  userProfile: UserProfileEntity | null;
}
