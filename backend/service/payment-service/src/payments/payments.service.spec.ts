import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { RefundStatus } from './refund-status.enum';

describe('PaymentsService', () => {
  const actor = {
    accountId: 'a1000000-0000-4000-8000-000000000001',
    role: 'ADMIN',
  };

  const createPayment = (
    overrides: Partial<PaymentEntity> = {},
  ): PaymentEntity =>
    ({
      payment_id: 'a6000000-0000-4000-8000-000000000099',
      appointment_id: 'a5000000-0000-4000-8000-000000000099',
      amount: 500000,
      currency: 'VND',
      status: 'paid',
      provider: 'vnpay',
      provider_txn_ref: null,
      order_info: null,
      refund_amount: null,
      refunded_at: null,
      refund_status: null,
      refund_reason: null,
      refund_requested_by: null,
      refund_requested_at: null,
      refund_reviewed_by: null,
      refund_reviewed_at: null,
      created_at: new Date('2026-07-23T00:00:00.000Z'),
      updated_at: new Date('2026-07-23T00:00:00.000Z'),
      ...overrides,
    }) as PaymentEntity;

  const createHarness = (payment: PaymentEntity | null) => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(payment),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn(),
    };
    const refundNotifications = {
      publish: jest.fn(),
    };
    const service = new PaymentsService(
      repository as never,
      redis as never,
      refundNotifications as never,
    );
    return { service, repository, redis, refundNotifications };
  };

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'unit-test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.AUTH_JWT_SECRET;
  });

  describe('handleVnpayReturn', () => {
    it('rejects a callback without a transaction reference', async () => {
      const { service } = createHarness(null);

      await expect(
        service.handleVnpayReturn({ vnp_ResponseCode: '00' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('marks a successful payment paid and synchronizes its appointment', async () => {
      const payment = createPayment({ status: 'pending' });
      const { service, repository } = createHarness(payment);
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: true, status: 200 } as Response);

      await expect(
        service.handleVnpayReturn({
          vnp_ResponseCode: '00',
          vnp_TxnRef: payment.payment_id,
          vnp_TransactionNo: 'VNP-100',
        }),
      ).resolves.toMatchObject({
        status: 'paid',
        provider_txn_ref: 'VNP-100',
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(payment.appointment_id),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            payment_status: 'paid',
            payment_id: payment.payment_id,
          }),
        }),
      );
    });

    it('retries appointment synchronization for an already-paid callback', async () => {
      const payment = createPayment({ status: 'paid' });
      const { service, repository, redis } = createHarness(payment);
      redis.set.mockResolvedValue(null);
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: true, status: 200 } as Response);

      await expect(
        service.handleVnpayReturn({
          vnp_ResponseCode: '00',
          vnp_TxnRef: payment.payment_id,
          vnp_TransactionNo: 'VNP-100',
        }),
      ).resolves.toBe(payment);

      expect(repository.save).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(payment.appointment_id),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('marks a rejected callback failed without synchronizing the appointment', async () => {
      const payment = createPayment({ status: 'pending' });
      const { service, repository } = createHarness(payment);
      const fetchMock = jest.spyOn(global, 'fetch');

      await expect(
        service.handleVnpayReturn({
          vnp_ResponseCode: '24',
          vnp_TxnRef: payment.payment_id,
          vnp_TransactionNo: 'VNP-FAILED',
        }),
      ).resolves.toMatchObject({
        status: 'failed',
        provider_txn_ref: 'VNP-FAILED',
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('refund workflow', () => {
    it('opens a full refund request for a paid payment', async () => {
      const payment = createPayment();
      const { service, repository } = createHarness(payment);

      await expect(
        service.requestRefund(payment.payment_id, { reason: 'Duplicate' }, actor),
      ).resolves.toMatchObject({
        refund_status: RefundStatus.REQUESTED,
        refund_reason: 'Duplicate',
        refund_requested_by: actor.accountId,
        refund_amount: payment.amount,
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('rejects refund requests for unpaid payments and duplicate open requests', async () => {
      const unpaid = createHarness(createPayment({ status: 'pending' }));
      await expect(
        unpaid.service.requestRefund('payment-1', {}, actor),
      ).rejects.toBeInstanceOf(BadRequestException);

      const duplicate = createHarness(
        createPayment({ refund_status: RefundStatus.REQUESTED }),
      );
      await expect(
        duplicate.service.requestRefund('payment-1', {}, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('approves a requested refund and publishes the patient outcome', async () => {
      const payment = createPayment({
        refund_status: RefundStatus.REQUESTED,
        refund_amount: 250000,
      });
      const { service, repository, refundNotifications } =
        createHarness(payment);
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              patient_id: 'a3000000-0000-4000-8000-000000000001',
            },
          }),
        } as Response);

      await expect(
        service.approveRefund(payment.payment_id, {}, actor),
      ).resolves.toMatchObject({
        status: 'refunded',
        refund_status: RefundStatus.REFUNDED,
        refund_reviewed_by: actor.accountId,
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(refundNotifications.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: 'REFUND_APPROVED',
          paymentId: payment.payment_id,
        }),
      );
    });

    it('rejects a requested refund and publishes the reason', async () => {
      const payment = createPayment({
        refund_status: RefundStatus.UNDER_REVIEW,
      });
      const { service, refundNotifications } = createHarness(payment);
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          patient_id: 'a3000000-0000-4000-8000-000000000001',
        }),
      } as Response);

      await expect(
        service.rejectRefund(
          payment.payment_id,
          { reason: 'Outside policy' },
          actor,
        ),
      ).resolves.toMatchObject({
        refund_status: RefundStatus.REJECTED,
        refund_reason: 'Outside policy',
        refund_reviewed_by: actor.accountId,
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect(refundNotifications.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: 'REFUND_REJECTED',
          message: expect.stringContaining('Outside policy'),
        }),
      );
    });
  });
});
