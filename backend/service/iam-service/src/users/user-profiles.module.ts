import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfilesController } from './user-profiles.controller';
import { UserProfilesService } from './user-profiles.service';
import { UserProfileEntity } from './entities/user-profile.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity], 'iamUserConnection'),
    // Default Connection (auth_service_db) — Just The Entity, Not
    // AccountsModule, To Avoid A Circular Module Dependency (AccountsModule
    // Already Imports UserProfilesModule).
    TypeOrmModule.forFeature([AccountEntity]),
    AuditLogsModule,
  ],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}
