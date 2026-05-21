import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpTokensService } from './otp-tokens.service';
import { OtpTokenEntity } from './infrastructure/persistence/relational/entities/otp-token.entity';
import { OtpTokensRepository } from './infrastructure/persistence/repositories/otp-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OtpTokenEntity])],
  providers: [OtpTokensService, OtpTokensRepository],
  exports: [OtpTokensService, OtpTokensRepository],
})
export class OtpTokensModule {}
