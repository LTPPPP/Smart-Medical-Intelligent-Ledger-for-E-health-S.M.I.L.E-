import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthConnectionsService } from './oauth-connections.service';
import { OAuthConnectionEntity } from './infrastructure/persistence/relational/entities/oauth-connection.entity';
import { OAuthConnectionsRepository } from './infrastructure/persistence/repositories/oauth-connection.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OAuthConnectionEntity])],
  providers: [OAuthConnectionsService, OAuthConnectionsRepository],
  exports: [OAuthConnectionsService, OAuthConnectionsRepository],
})
export class OAuthConnectionsModule {}
