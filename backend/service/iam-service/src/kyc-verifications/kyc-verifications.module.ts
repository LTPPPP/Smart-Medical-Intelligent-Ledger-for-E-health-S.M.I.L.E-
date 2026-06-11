import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { KycVerificationEntity } from './entities/kyc-verification.entity';
import { KycFileAccessAuditService } from './kyc-file-access-audit.service';
import { KycFileStorageService } from './kyc-file-storage.service';
import { KycOcrAssessmentService } from './kyc-ocr-assessment.service';
import { KycOcrPollerService } from './kyc-ocr-poller.service';
import { KycOcrService } from './kyc-ocr.service';
import { KycRetentionService } from './kyc-retention.service';
import { KycVerificationsController } from './kyc-verifications.controller';
import { KycVerificationsService } from './kyc-verifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity]),
    TypeOrmModule.forFeature([KycVerificationEntity], 'iamUserConnection'),
    AuditLogsModule,
  ],
  controllers: [KycVerificationsController],
  providers: [
    KycVerificationsService,
    KycFileAccessAuditService,
    KycFileStorageService,
    KycOcrAssessmentService,
    KycOcrService,
    KycOcrPollerService,
    KycRetentionService,
  ],
  exports: [KycVerificationsService],
})
export class KycVerificationsModule {}
