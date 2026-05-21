import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshTokenEntity } from './infrastructure/persistence/relational/entities/refresh-token.entity';
import { RefreshTokensRepository } from './infrastructure/persistence/repositories/refresh-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [RefreshTokensService, RefreshTokensRepository],
  exports: [RefreshTokensService, RefreshTokensRepository],
})
export class RefreshTokensModule {}
