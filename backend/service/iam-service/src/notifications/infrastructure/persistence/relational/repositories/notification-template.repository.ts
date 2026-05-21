import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotificationTemplateEntity } from '../entities/notification-template.entity';

@Injectable()
export class NotificationTemplateRepository extends Repository<NotificationTemplateEntity> {
  constructor(
    @InjectDataSource('iamUserConnection')
    dataSource: DataSource,
  ) {
    super(NotificationTemplateEntity, dataSource.createEntityManager());
  }

  async findByTemplateCode(templateCode: string): Promise<NotificationTemplateEntity | null> {
    return this.findOne({
      where: { templateCode, isActive: true },
    });
  }
}
