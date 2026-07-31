import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import {
  SendNotificationDto,
  SendNotificationResult,
} from './gateway.interface';
import { PushSubscriptionRepository } from '../infrastructure/persistence/relational/repositories/push-subscription.repository';

const GONE_STATUS_CODES = new Set([404, 410]);

@Injectable()
export class PushGateway {
  constructor(
    private readonly configService: ConfigService<any>,
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
  ) {}

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    const publicKey = this.configService.get('push.vapidPublicKey', {
      infer: true,
    });
    const privateKey = this.configService.get('push.vapidPrivateKey', {
      infer: true,
    });
    const subject = this.configService.get('push.vapidSubject', {
      infer: true,
    });

    if (!publicKey || !privateKey) {
      return { id: `push_skipped_${Date.now()}`, status: 'skipped' };
    }

    const subscriptions = await this.pushSubscriptionRepository.findByUserId(
      dto.recipientId,
    );
    if (subscriptions.length === 0) {
      return { id: `push_skipped_${Date.now()}`, status: 'skipped' };
    }

    const payload = JSON.stringify({
      title: dto.subject ?? 'S.M.I.L.E',
      body: dto.message,
    });

    let delivered = 0;
    let lastError: unknown;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { vapidDetails: { subject, publicKey, privateKey } },
        );
        delivered += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode !== undefined && GONE_STATUS_CODES.has(statusCode)) {
          // Push service says the subscription no longer exists — prune it.
          await this.pushSubscriptionRepository.delete({
            subscriptionId: subscription.subscriptionId,
          });
          continue;
        }
        lastError = error;
      }
    }

    if (delivered > 0) {
      return { id: `push_${delivered}_devices`, status: 'sent' };
    }
    if (lastError) {
      // Rethrow without logging — the orchestration layer logs once, sanitized.
      throw Object.assign(new Error('Web push delivery failed'), {
        name: 'WebPushDeliveryError',
        code:
          (lastError as { statusCode?: number })?.statusCode ??
          'PUSH_DELIVERY_FAILED',
      });
    }
    // Every subscription was stale and has been pruned.
    return { id: `push_skipped_${Date.now()}`, status: 'skipped' };
  }
}
