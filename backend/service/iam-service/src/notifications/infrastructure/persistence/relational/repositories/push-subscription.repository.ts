import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PushSubscriptionEntity } from '../entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionRepository extends Repository<PushSubscriptionEntity> {
  constructor(
    @InjectDataSource('iamUserConnection')
    dataSource: DataSource,
  ) {
    super(PushSubscriptionEntity, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<PushSubscriptionEntity[]> {
    return this.find({ where: { userId } });
  }
}
