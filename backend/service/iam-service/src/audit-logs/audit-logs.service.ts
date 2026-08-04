import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { UserProfileEntity } from '../users/entities/user-profile.entity';
import { v4 as uuidv4 } from 'uuid';

export type AuditLogWithUser = AuditLogEntity & { full_name: string | null };

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLogEntity, 'iamUserConnection')
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserProfileEntity, 'iamUserConnection')
    private readonly userProfileRepository: Repository<UserProfileEntity>,
  ) {}

  // Every call site fires this with `void` (fire-and-forget) so a request
  // never waits on audit logging. That means a thrown/rejected write was
  // previously lost with zero trace anywhere — catch and log here so
  // failures are at least visible, instead of silently disappearing.
  async create(dto: CreateAuditLogDto): Promise<AuditLogEntity | null> {
    const log = this.auditLogRepository.create({
      log_id: uuidv4(),
      user_id: dto.user_id ?? null,
      action: dto.action,
      resource: dto.resource,
      resource_id: dto.resource_id ?? null,
      ip_address: dto.ip_address ?? null,
      user_agent: dto.user_agent ?? null,
      details: dto.details ?? null,
    });
    try {
      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error(
        `Failed to write audit log (action=${dto.action}, resource=${dto.resource}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async findAll(query: QueryAuditLogDto): Promise<{ data: AuditLogWithUser[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AuditLogEntity> = {};

    if (query.user_id) where.user_id = query.user_id;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.from_date) where.created_at = MoreThanOrEqual(new Date(query.from_date));
    if (query.to_date) where.created_at = LessThanOrEqual(new Date(query.to_date));

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const userIds = [...new Set(data.filter((l) => l.user_id).map((l) => l.user_id as string))];
    const nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const profiles = await this.userProfileRepository.findBy({ user_id: In(userIds) });
      profiles.forEach((p) => nameMap.set(p.user_id, p.full_name));
    }

    const enriched = data.map((log) =>
      Object.assign(log, { full_name: log.user_id ? (nameMap.get(log.user_id) ?? null) : null }),
    );

    return { data: enriched, total };
  }

  async findById(id: string): Promise<AuditLogWithUser | null> {
    const log = await this.auditLogRepository.findOne({ where: { log_id: id } });
    if (!log) return null;

    let full_name: string | null = null;
    if (log.user_id) {
      const profile = await this.userProfileRepository.findOne({ where: { user_id: log.user_id } });
      full_name = profile?.full_name ?? null;
    }

    return Object.assign(log, { full_name });
  }
}
