import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogEntity } from './entities/audit-log.entity';
import { UserProfileEntity } from '../users/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, UserProfileEntity], 'iamUserConnection')],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
