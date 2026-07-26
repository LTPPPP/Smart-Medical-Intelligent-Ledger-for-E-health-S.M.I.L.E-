import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class ConfirmAvatarDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/v1/smile/avatars/xyz.jpg' })
  @IsNotEmpty()
  @IsUrl({ protocols: ['https'] })
  avatarUrl: string;
}
