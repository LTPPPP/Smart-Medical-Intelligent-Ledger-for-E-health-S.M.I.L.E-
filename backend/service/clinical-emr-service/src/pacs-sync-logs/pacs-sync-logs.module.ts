import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacsSyncLogsService } from './pacs-sync-logs.service';
import { PacsSyncLogsController } from './pacs-sync-logs.controller';
import { PacsSyncLogEntity } from './entities/pacs-sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PacsSyncLogEntity])],
  controllers: [PacsSyncLogsController],
  providers: [PacsSyncLogsService],
  exports: [PacsSyncLogsService],
})
export class PacsSyncLogsModule {}
