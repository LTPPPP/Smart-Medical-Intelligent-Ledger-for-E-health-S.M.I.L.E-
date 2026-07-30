import { RefundNotificationPublisher } from './refund-notification.publisher';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('RefundNotificationPublisher', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should log only a sanitized error class when IAM is unavailable', async () => {
    const sentinelMessage =
      'SENTINEL_RAW_REFUND_ERROR pay-99999999-9999-9999-9999-999999999999';
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError(sentinelMessage),
    ) as unknown as typeof fetch;
    const publisher = new RefundNotificationPublisher();
    const warnSpy = jest
      .spyOn((publisher as any).logger, 'warn')
      .mockImplementation();

    publisher.publish({
      recipientId: 'patient-sentinel',
      notificationType: 'REFUND_APPROVED',
      paymentId: 'pay-99999999-9999-9999-9999-999999999999',
      subject: 'Refund approved',
      message: 'Refund message',
    });
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=refund_notification outcome=failed type=REFUND_APPROVED error_class=TypeError error_code=unknown',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(sentinelMessage);
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'pay-99999999-9999-9999-9999-999999999999',
    );
  });

  it('should sanitize IAM rejection diagnostics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
    }) as unknown as typeof fetch;
    const publisher = new RefundNotificationPublisher();
    const warnSpy = jest
      .spyOn((publisher as any).logger, 'warn')
      .mockImplementation();

    publisher.publish({
      recipientId: 'patient-sentinel',
      notificationType: 'REFUND_REJECTED',
      paymentId: 'pay-99999999-9999-9999-9999-999999999999',
      subject: 'Refund rejected',
      message: 'Refund message',
    });
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=refund_notification outcome=rejected type=REFUND_REJECTED error_class=HttpError http_status=502',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'pay-99999999-9999-9999-9999-999999999999',
    );
  });
});
