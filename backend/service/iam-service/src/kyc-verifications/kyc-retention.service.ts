import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { KycVerificationEntity } from './entities/kyc-verification.entity';
import { KycFileStorageService } from './kyc-file-storage.service';

@Injectable()
export class KycRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KycRetentionService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(KycVerificationEntity, 'iamUserConnection')
    private readonly kycRepository: Repository<KycVerificationEntity>,
    private readonly fileStorage: KycFileStorageService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  onModuleInit(): void {
    if (process.env.KYC_RETENTION_CLEANUP_ENABLED === 'false') {
      return;
    }

    const intervalMs = Number(process.env.KYC_RETENTION_CLEANUP_INTERVAL_MS || 24 * 60 * 60 * 1000);
    this.timer = setInterval(() => {
      void this.cleanupExpired().catch((error) => {
        const message = error instanceof Error ? error.message : 'KYC retention cleanup failed';
        this.logger.warn(message);
      });
    }, Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 24 * 60 * 60 * 1000);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async cleanupExpired(now = new Date()): Promise<number> {
    const expired = await this.kycRepository.find({
      where: {
        retention_expires_at: LessThanOrEqual(now),
        deleted_at: IsNull(),
      },
      take: Number(process.env.KYC_RETENTION_CLEANUP_BATCH_SIZE || 50),
    });

    for (const entity of expired) {
      await this.fileStorage.deleteMany([
        entity.id_front_image,
        entity.id_back_image,
        entity.selfie_image,
      ]);
      entity.deleted_at = now;
      entity.id_front_image = null;
      entity.id_back_image = null;
      entity.selfie_image = null;
      await this.kycRepository.save(entity);
      await this.auditLogsService.create({
        user_id: null,
        action: 'KYC_FILES_DELETED',
        resource: 'kyc',
        resource_id: entity.kyc_id,
        details: { reason: 'retention_expired' },
      });
    }

    return expired.length;
  }
}
