import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PacsSyncLogEntity } from './entities/pacs-sync-log.entity';
import { CreatePacsSyncLogDto } from './dto/create-pacs-sync-log.dto';
import { UpdatePacsSyncLogDto } from './dto/update-pacs-sync-log.dto';

@Injectable()
export class PacsSyncLogsService {
  constructor(
    @InjectRepository(PacsSyncLogEntity)
    private pacsSyncLogsRepository: Repository<PacsSyncLogEntity>,
  ) {}

  async create(
    createPacsSyncLogDto: CreatePacsSyncLogDto,
  ): Promise<PacsSyncLogEntity> {
    const pacsSyncLog = this.pacsSyncLogsRepository.create(createPacsSyncLogDto);
    return this.pacsSyncLogsRepository.save(pacsSyncLog);
  }

  async findAll(): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find();
  }

  async findOne(sync_id: string): Promise<PacsSyncLogEntity> {
    const pacsSyncLog = await this.pacsSyncLogsRepository.findOne({
      where: { sync_id },
    });
    if (!pacsSyncLog) {
      throw new NotFoundException(`PACS sync log with ID ${sync_id} not found`);
    }
    return pacsSyncLog;
  }

  async findByImageId(image_id: string): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find({
      where: { image_id },
    });
  }

  async findBySyncType(sync_type: string): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find({
      where: { sync_type },
    });
  }

  async findByPacsServer(pacs_server: string): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find({
      where: { pacs_server },
    });
  }

  async findByStatus(status: string): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find({
      where: { status },
    });
  }

  async findFailed(): Promise<PacsSyncLogEntity[]> {
    return this.pacsSyncLogsRepository.find({
      where: { status: 'failed' },
    });
  }

  async findRecent(hours: number = 24): Promise<PacsSyncLogEntity[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    return this.pacsSyncLogsRepository.find({
      where: {
        synced_at: MoreThan(since),
      },
      order: { synced_at: 'DESC' },
    });
  }

  async update(
    sync_id: string,
    updatePacsSyncLogDto: UpdatePacsSyncLogDto,
  ): Promise<PacsSyncLogEntity> {
    const pacsSyncLog = await this.findOne(sync_id);
    Object.assign(pacsSyncLog, updatePacsSyncLogDto);
    return this.pacsSyncLogsRepository.save(pacsSyncLog);
  }

  async remove(sync_id: string): Promise<void> {
    const pacsSyncLog = await this.findOne(sync_id);
    await this.pacsSyncLogsRepository.remove(pacsSyncLog);
  }
}
