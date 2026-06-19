import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './infrastructure/persistence/relational/entities/account.entity';
import { AccountsRepository } from './infrastructure/persistence/relational/repositories/account.repository';
import { OtpTokensModule } from '../otp-tokens/otp-tokens.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), OtpTokensModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
