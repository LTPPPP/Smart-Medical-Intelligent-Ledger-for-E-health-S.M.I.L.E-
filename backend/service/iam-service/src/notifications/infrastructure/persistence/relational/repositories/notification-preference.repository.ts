import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotificationPreferenceEntity } from '../entities/notification-preference.entity';

@Injectable()
export class NotificationPreferenceRepository extends Repository<NotificationPreferenceEntity> {
  constructor(
    @InjectDataSource('iamUserConnection')
    dataSource: DataSource,
  ) {
    super(NotificationPreferenceEntity, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<NotificationPreferenceEntity[]> {
    return this.find({ where: { userId } });
  }

  async findByUserIdAndType(userId: string, notificationType: string): Promise<NotificationPreferenceEntity[]> {
    return this.find({
      where: { userId, notificationType, isEnabled: true },
    });
  }

  async findOneByUserIdAndTypeAndChannel(
    userId: string,
    notificationType: string,
    channel: string,
  ): Promise<NotificationPreferenceEntity | null> {
    return this.findOne({
      where: { userId, notificationType, channel },
    });
  }
}
