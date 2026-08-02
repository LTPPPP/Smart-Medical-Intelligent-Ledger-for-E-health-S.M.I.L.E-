import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SendNotificationDto,
  SendNotificationResult,
} from './gateway.interface';

interface TwilioMessageResponse {
  sid?: string;
  code?: number;
  status?: string;
}

@Injectable()
export class SmsGateway {
  private static readonly REQUEST_TIMEOUT_MS = 10000;

  constructor(private readonly configService: ConfigService<any>) {}

  async send(dto: SendNotificationDto): Promise<SendNotificationResult> {
    const enabled = this.configService.get('sms.enabled', { infer: true });
    const accountSid = this.configService.get('sms.accountSid', {
      infer: true,
    });
    const authToken = this.configService.get('sms.authToken', { infer: true });
    const from = this.configService.get('sms.from', { infer: true });

    if (
      !enabled ||
      !accountSid ||
      !authToken ||
      !from ||
      !dto.recipientPhone
    ) {
      return {
        id: `sms_skipped_${Date.now()}`,
        status: 'skipped',
      };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: dto.recipientPhone,
          From: from,
          Body: dto.message,
        }).toString(),
        signal: AbortSignal.timeout(SmsGateway.REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      // Surface only the Twilio numeric error code — the response body may
      // echo the destination phone number and message content.
      const errorCode = await response
        .json()
        .then((body: TwilioMessageResponse) => body?.code)
        .catch(() => undefined);
      throw Object.assign(new Error('Twilio message request failed'), {
        name: 'TwilioApiError',
        code: errorCode ?? response.status,
      });
    }

    const body = (await response.json()) as TwilioMessageResponse;
    return {
      id: body.sid || `sms_${Date.now()}`,
      status: 'sent',
    };
  }
}
