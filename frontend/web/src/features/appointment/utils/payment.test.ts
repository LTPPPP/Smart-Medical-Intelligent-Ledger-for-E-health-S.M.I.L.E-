import { describe, expect, it } from 'vitest';

import { extractPaymentUrl, normalizePaymentAppointment } from './payment';

describe('payment helpers', () => {
  it('normalizes raw appointment rows for payment initiation', () => {
    expect(
      normalizePaymentAppointment({
        appointment_id: 'apt-1',
        appointment_code: 'APT-1',
        payment_status: 'unpaid',
        service: { service_name: 'Oral check', base_price: 150000 },
      }),
    ).toEqual(expect.objectContaining({
      appointmentId: 'apt-1',
      appointmentCode: 'APT-1',
      paymentStatus: 'unpaid',
      serviceName: 'Oral check',
      amount: 150000,
      canPay: true,
    }));
  });

  it('reads both wrapped and direct payment urls', () => {
    expect(extractPaymentUrl({ data: { data: { paymentUrl: 'wrapped-url' } } })).toBe('wrapped-url');
    expect(extractPaymentUrl({ data: { paymentUrl: 'direct-url' } })).toBe('direct-url');
  });
});
