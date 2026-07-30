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

  it.each([
    ['SMS', () => new SmsGateway(), 'skipped'],
    ['push', () => new PushGateway(), 'skipped'],
    ['in-app', () => new InAppGateway(), 'created'],
  ])('does not emit %s content and reports its truthful status', async (_channel, createGateway, expectedStatus) => {
    const result = await createGateway().send(pii);

    expect(result.status).toBe(expectedStatus);
    const output = loggerOutput();
    expect(output).not.toContain(pii.recipientId);
    expect(output).not.toContain(pii.subject);
    expect(output).not.toContain(pii.message);
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
