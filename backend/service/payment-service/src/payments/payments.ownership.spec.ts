import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from './payment-status.enum';
import { RefundStatus } from './refund-status.enum';

const paymentId = 'pay-1';
const appointmentId = 'apt-1';
const patient = { accountId: 'patient-account', role: 'PATIENT' };
const receptionist = { accountId: 'staff-account', role: 'RECEPTIONIST' };
const bearer = 'Bearer patient-token';

function paidPayment(overrides: Record<string, unknown> = {}) {
  return {
    payment_id: paymentId,
    appointment_id: appointmentId,
    amount: 500_000,
    status: PaymentStatus.PAID,
    refund_status: null,
    ...overrides,
  };
}

function createService(payment: Record<string, unknown> | null = paidPayment()) {
  const paymentRepository = {
    findOne: jest.fn().mockResolvedValue(payment),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const service = new PaymentsService(
    paymentRepository as any,
    { get: jest.fn(), set: jest.fn() } as any,
    { publish: jest.fn() } as any,
  );
  return { service, paymentRepository };
}

/** clinical-emr is the authority on appointment ownership. */
function mockClinical(ok: boolean, status = ok ? 200 : 403) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue({ patient_id: 'patient-1' }),
  }) as unknown as typeof fetch;
}

describe('payment ownership', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("refuses to read a payment on someone else's appointment", async () => {
    mockClinical(false);
    const { service } = createService();

    await expect(
      service.findByIdForActor(paymentId, patient, bearer),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows the owning patient to read their payment', async () => {
    mockClinical(true);
    const { service } = createService();

    await expect(
      service.findByIdForActor(paymentId, patient, bearer),
    ).resolves.toMatchObject({ payment_id: paymentId });
  });

  it('does not call clinical-emr for staff', async () => {
    mockClinical(false);
    const { service } = createService();

    await expect(
      service.findByIdForActor(paymentId, receptionist, undefined),
    ).resolves.toMatchObject({ payment_id: paymentId });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses a payment read with no bearer token to forward', async () => {
    mockClinical(true);
    const { service } = createService();

    await expect(
      service.findByIdForActor(paymentId, patient, undefined),
    ).rejects.toThrow(ForbiddenException);
  });

  it("refuses a refund request against someone else's payment", async () => {
    mockClinical(false);
    const { service, paymentRepository } = createService();

    await expect(
      service.requestRefund(paymentId, {}, patient, bearer),
    ).rejects.toThrow(ForbiddenException);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('refuses appointment payment history the caller cannot see', async () => {
    mockClinical(false);
    const { service } = createService();

    await expect(
      service.findByAppointment(appointmentId, patient, bearer),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('refund amount bounds', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects a refund larger than the captured amount', async () => {
    mockClinical(true);
    const { service } = createService();

    await expect(
      service.requestRefund(paymentId, { amount: 500_001 }, receptionist),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a zero refund', async () => {
    mockClinical(true);
    const { service } = createService();

    await expect(
      service.requestRefund(paymentId, { amount: 0 }, receptionist),
    ).rejects.toThrow(BadRequestException);
  });

  it('defaults to the full captured amount', async () => {
    mockClinical(true);
    const { service } = createService();

    const saved = await service.requestRefund(paymentId, {}, receptionist);

    expect(saved.refund_amount).toBe(500_000);
    expect(saved.refund_status).toBe(RefundStatus.REQUESTED);
  });

  it('rejects an approval above the captured amount', async () => {
    mockClinical(true);
    const { service } = createService(
      paidPayment({
        refund_status: RefundStatus.REQUESTED,
        refund_amount: 500_000,
      }),
    );

    await expect(
      service.approveRefund(paymentId, { amount: 900_000 }, receptionist),
    ).rejects.toThrow(BadRequestException);
  });
});
