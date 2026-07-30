import {
  getSanitizedErrorMetadata,
  PaymentsService,
} from './payments.service';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('PaymentsService notification boundary logging', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createService() {
    return new PaymentsService(
      {} as any,
      {} as any,
      { publish: jest.fn() } as any,
    );
  }

  it('should sanitize appointment payment-status sync failures', async () => {
    const sentinelMessage =
      'SENTINEL_RAW_PAYMENT_SYNC_ERROR appointment-99999999';
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError(sentinelMessage),
    ) as unknown as typeof fetch;
    const service = createService();
    const warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();

    (service as any).updateAppointmentPaymentStatus(
      'appointment-99999999',
      {
        payment_status: 'paid',
        payment_id: 'payment-99999999',
      },
    );
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=appointment_payment_status_sync outcome=failed error_class=TypeError error_code=unknown',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(sentinelMessage);
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'appointment-99999999',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'payment-99999999',
    );
  });

  it('should sanitize appointment payment-status rejection diagnostics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
    }) as unknown as typeof fetch;
    const service = createService();
    const warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();

    (service as any).updateAppointmentPaymentStatus(
      'appointment-99999999',
      {
        payment_status: 'paid',
        payment_id: 'payment-99999999',
      },
    );
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=appointment_payment_status_sync outcome=rejected error_class=HttpError http_status=409',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'appointment-99999999',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'payment-99999999',
    );
  });

  it('should sanitize refund recipient lookup failures', async () => {
    const sentinelMessage =
      'SENTINEL_RAW_REFUND_LOOKUP_ERROR payment-99999999';
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError(sentinelMessage),
    ) as unknown as typeof fetch;
    const service = createService();
    const warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation();

    (service as any).notifyRefundOutcome(
      {
        appointment_id: 'appointment-99999999',
        payment_id: 'payment-99999999',
        amount: 1000,
      },
      'REFUND_REJECTED',
      'SENTINEL_REJECTION_REASON',
    );
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'operation=refund_notification_recipient_lookup outcome=failed error_class=TypeError error_code=unknown',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(sentinelMessage);
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'payment-99999999',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'appointment-99999999',
    );
  });

  it('bounds error class and code without retaining raw fields', () => {
    const error = Object.assign(new Error('SENTINEL_RAW_REDIS_MESSAGE'), {
      name: 'ReplyError',
      code: 'ECONNREFUSED',
      stack: 'SENTINEL_PRIVATE_STACK',
    });

    expect(getSanitizedErrorMetadata(error)).toEqual({
      errorClass: 'ReplyError',
      errorCode: 'ECONNREFUSED',
    });
    expect(
      JSON.stringify(getSanitizedErrorMetadata(error)),
    ).not.toContain('SENTINEL');
  });
});
