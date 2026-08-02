import { Logger } from '@nestjs/common';
import { EmailGateway } from './email.gateway';
import { InAppGateway } from './in-app.gateway';
import { PushGateway } from './push.gateway';
import { SmsGateway } from './sms.gateway';

describe('Notification gateway logging privacy', () => {
  const pii = {
    recipientId: 'sentinel-recipient-id',
    recipientEmail: 'sentinel-patient@example.test',
    subject: 'sentinel-private-subject',
    message: 'sentinel-private-message',
  };

  function loggerOutput(): string {
    return JSON.stringify([
      jest.mocked(Logger.prototype.log).mock.calls,
      jest.mocked(Logger.prototype.warn).mock.calls,
      jest.mocked(Logger.prototype.error).mock.calls,
    ]);
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const unconfiguredConfig = { get: jest.fn().mockReturnValue(undefined) } as any;
  const emptySubscriptionRepository = {
    findByUserId: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  } as any;

  it.each([
    ['SMS', () => new SmsGateway(unconfiguredConfig), 'skipped'],
    ['push', () => new PushGateway(unconfiguredConfig, emptySubscriptionRepository), 'skipped'],
    ['in-app', () => new InAppGateway(), 'created'],
  ])('does not emit %s content and reports its truthful status', async (_channel, createGateway, expectedStatus) => {
    const result = await createGateway().send(pii);

    expect(result.status).toBe(expectedStatus);
    const output = loggerOutput();
    expect(output).not.toContain(pii.recipientId);
    expect(output).not.toContain(pii.subject);
    expect(output).not.toContain(pii.message);
  });

  it('sends SMS through Twilio without logging content and returns the message sid', async () => {
    const configService = {
      get: jest.fn((key: string) =>
        ({
          'sms.enabled': true,
          'sms.accountSid': 'ACtest',
          'sms.authToken': 'token',
          'sms.from': '+15005550006',
        })[key],
      ),
    } as any;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ sid: 'SMsentinel123' }),
    }) as unknown as typeof fetch;

    try {
      const result = await new SmsGateway(configService).send({
        ...pii,
        recipientPhone: '+84900000001',
      });

      expect(result).toEqual({ id: 'SMsentinel123', status: 'sent' });
      const output = loggerOutput();
      expect(output).not.toContain('+84900000001');
      expect(output).not.toContain(pii.message);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('rethrows Twilio failures with only the numeric error code', async () => {
    const configService = {
      get: jest.fn((key: string) =>
        ({
          'sms.enabled': true,
          'sms.accountSid': 'ACtest',
          'sms.authToken': 'token',
          'sms.from': '+15005550006',
        })[key],
      ),
    } as any;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        code: 21211,
        message: 'sentinel-invalid-number +84900000001',
      }),
    }) as unknown as typeof fetch;

    try {
      await expect(
        new SmsGateway(configService).send({ ...pii, recipientPhone: '+84900000001' }),
      ).rejects.toMatchObject({ name: 'TwilioApiError', code: 21211 });
      const output = loggerOutput();
      expect(output).not.toContain('+84900000001');
      expect(output).not.toContain('sentinel-invalid-number');
      expect(Logger.prototype.error).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('does not emit email addresses or recipient identifiers after delivery', async () => {
    const gateway = new EmailGateway({
      sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
    } as any);

    await gateway.send(pii);

    const output = loggerOutput();
    expect(output).not.toContain(pii.recipientEmail);
    expect(output).not.toContain(pii.recipientId);
  });

  it('does not log raw email delivery errors before rethrowing', async () => {
    const rawError = 'sentinel-transport-error-with-private-data';
    const gateway = new EmailGateway({
      sendNotificationEmail: jest.fn().mockRejectedValue(new Error(rawError)),
    } as any);

    await expect(gateway.send(pii)).rejects.toThrow(rawError);
    expect(loggerOutput()).not.toContain(rawError);
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });
});
