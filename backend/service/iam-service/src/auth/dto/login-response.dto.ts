import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../accounts/domain/account';

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
}
