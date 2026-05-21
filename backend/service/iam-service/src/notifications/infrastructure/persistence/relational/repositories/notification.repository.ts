import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
  constructor(
    @InjectDataSource('iamUserConnection')
    dataSource: DataSource,
  ) {
    super(NotificationEntity, dataSource.createEntityManager());
  }

  async findByRecipientId(
    recipientId: string,
    paginationOptions: { page: number; limit: number },
  ): Promise<NotificationEntity[]> {
    return this.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  async findByStatus(status: string): Promise<NotificationEntity[]> {
    return this.find({
      where: { status },
    });
  }

  async findPendingNotifications(): Promise<NotificationEntity[]> {
    const now = new Date();
    return this.createQueryBuilder('notification')
      .where('notification.status = :status', { status: 'pending' })
      .andWhere('notification.scheduled_at <= :now', { now })
      .andWhere('notification.retry_count < notification.max_retries')
      .getMany();
  }

  async findByRelatedEntity(relatedEntityId: string, relatedEntityType: string): Promise<NotificationEntity[]> {
    return this.find({
      where: { relatedEntityId, relatedEntityType },
    });
  }

  async countByRecipientId(recipientId: string): Promise<number> {
    return this.count({ where: { recipientId } });
  }
}
