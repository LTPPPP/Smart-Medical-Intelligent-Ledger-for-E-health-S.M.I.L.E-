import { MailService } from './mail.service';
import { Logger } from '@nestjs/common';

describe('MailService logging privacy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('propagates transport failures for the orchestration layer to log once', async () => {
    const rawError = 'sentinel-patient@example.test smtp://private-user:private-password';
    const transportError = Object.assign(new Error(rawError), {
      name: 'SMTPError',
      code: 'ECONNREFUSED',
    });
    const service = new MailService({ get: jest.fn() } as any);
    (service as any).transporter = {
      sendMail: jest.fn().mockRejectedValue(transportError),
    };
    const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(
      service.sendNotificationEmail({
        to: 'sentinel-patient@example.test',
        subject: 'Private appointment subject',
        html: '<p>Private appointment body</p>',
      }),
    ).rejects.toBe(transportError);

    expect(loggerError).not.toHaveBeenCalled();
  });
});
