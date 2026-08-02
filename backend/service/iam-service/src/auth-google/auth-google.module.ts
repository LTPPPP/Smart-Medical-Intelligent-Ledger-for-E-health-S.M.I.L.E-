import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthGoogleController } from './auth-google.controller';
import { AuthGoogleService } from './auth-google.service';

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [AuthGoogleController],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
