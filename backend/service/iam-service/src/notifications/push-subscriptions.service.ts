import { Injectable } from '@nestjs/common';
import { PushSubscriptionRepository } from './infrastructure/persistence/relational/repositories/push-subscription.repository';
import { PushSubscriptionEntity } from './infrastructure/persistence/relational/entities/push-subscription.entity';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';

@Injectable()
export class PushSubscriptionsService {
  constructor(
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
  ) {}

  async register(
    userId: string,
    dto: RegisterPushSubscriptionDto,
    userAgent?: string,
  ): Promise<PushSubscriptionEntity> {
    // Upsert by endpoint: a browser re-subscribing (or another user logging in
    // on the same browser) replaces the previous owner of that endpoint.
    const existing = await this.pushSubscriptionRepository.findOne({
      where: { endpoint: dto.endpoint },
    });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = dto.keys.p256dh;
      existing.auth = dto.keys.auth;
      existing.userAgent = userAgent ?? existing.userAgent;
      return this.pushSubscriptionRepository.save(existing);
    }

    const subscription = this.pushSubscriptionRepository.create({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: userAgent ?? null,
    });
    return this.pushSubscriptionRepository.save(subscription);
  }

  async unregister(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.delete({ userId, endpoint });
  }
}
