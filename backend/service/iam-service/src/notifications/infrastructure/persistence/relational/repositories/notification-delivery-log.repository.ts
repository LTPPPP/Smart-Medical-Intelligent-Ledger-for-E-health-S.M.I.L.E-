import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotificationDeliveryLogEntity } from '../entities/notification-delivery-log.entity';

@Injectable()
export class NotificationDeliveryLogRepository extends Repository<NotificationDeliveryLogEntity> {
  constructor(
    @InjectDataSource('iamUserConnection')
    dataSource: DataSource,
  ) {
    super(NotificationDeliveryLogEntity, dataSource.createEntityManager());
  }

  async findByNotificationId(notificationId: string): Promise<NotificationDeliveryLogEntity[]> {
    return this.find({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByNotificationId(notificationId: string): Promise<NotificationDeliveryLogEntity | null> {
    return this.findOne({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });
  }
}
