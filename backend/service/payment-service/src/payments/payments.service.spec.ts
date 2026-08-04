import { BadRequestException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentStatus } from "./payment-status.enum";
import { RefundStatus } from "./refund-status.enum";

const paymentId = "pay-1";
const appointmentId = "apt-1";
const receptionist = { accountId: "staff-account", role: "RECEPTIONIST" };
const flushPromises = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

function pendingPayment(overrides: Record<string, unknown> = {}) {
  return {
    payment_id: paymentId,
    appointment_id: appointmentId,
    amount: 500_000,
    currency: "VND",
    status: PaymentStatus.PENDING,
    refund_status: null,
    order_info: "Dental checkup",
    ...overrides,
  };
}

function paidPayment(overrides: Record<string, unknown> = {}) {
  return pendingPayment({ status: PaymentStatus.PAID, ...overrides });
}

function createRepositoryMock(seed: Record<string, unknown> | null = null) {
  return {
    findOne: jest.fn().mockResolvedValue(seed),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
  };
}

function createService(
  seed: Record<string, unknown> | null = null,
  redisOverrides: Record<string, unknown> = {},
) {
  const paymentRepository = createRepositoryMock(seed);
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    ...redisOverrides,
  };
  const refundNotificationPublisher = { publish: jest.fn() };
  const service = new PaymentsService(
    paymentRepository as any,
    redis as any,
    refundNotificationPublisher as any,
  );
  return { service, paymentRepository, redis, refundNotificationPublisher };
}

function mockClinical(ok: boolean, patientId = "patient-1") {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 403,
    json: jest.fn().mockResolvedValue({ patient_id: patientId }),
  }) as unknown as typeof fetch;
}

describe("PaymentsService.initiate (Initiate Payment)", () => {
  const originalFetch = global.fetch;
  const originalMock = process.env.VNPAY_MOCK;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.VNPAY_MOCK = originalMock;
  });

  it("should create a pending payment and return a mock QR code", async () => {
    process.env.VNPAY_MOCK = "true";
    mockClinical(true);
    const { service, paymentRepository } = createService();

    const result = await service.initiate(
      { appointmentId, amount: 500_000, orderInfo: "Dental checkup" } as any,
      receptionist,
    );

    expect(paymentRepository.save).toHaveBeenCalled();
    expect(result.payment).toEqual(
      expect.objectContaining({
        appointment_id: appointmentId,
        amount: 500_000,
        status: PaymentStatus.PENDING,
      }),
    );
    expect(result.qrCode).toEqual(expect.stringContaining("data:image"));
    expect(result.paymentUrl).toBeUndefined();
  });

  it("should build a real VNPay redirect URL when mock mode is disabled", async () => {
    process.env.VNPAY_MOCK = "false";
    mockClinical(true);
    const { service } = createService();

    const result = await service.initiate(
      { appointmentId, amount: 500_000 } as any,
      receptionist,
    );

    expect(result.paymentUrl).toEqual(expect.stringContaining("vnp_TxnRef="));
    expect(result.qrCode).toBeUndefined();
  });

  it("should replay an in-flight idempotent request instead of creating a duplicate payment", async () => {
    process.env.VNPAY_MOCK = "true";
    mockClinical(true);
    const stored = JSON.stringify({
      paymentId,
      paymentUrl: undefined,
      qrCode: "data:image/png;base64,replayed",
    });
    const { service, paymentRepository, redis } = createService(
      pendingPayment(),
      {
        set: jest.fn().mockResolvedValue(null), // key already reserved
        get: jest.fn().mockResolvedValue(stored),
      },
    );

    const result = await service.initiate(
      { appointmentId, amount: 500_000 } as any,
      receptionist,
      undefined,
      "idem-key-1",
    );

    expect(result.payment).toEqual(
      expect.objectContaining({ payment_id: paymentId }),
    );
    expect(result.qrCode).toBe("data:image/png;base64,replayed");
    expect(paymentRepository.create).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalled();
  });
});

describe("PaymentsService.simulateMockPayment", () => {
  const originalFetch = global.fetch;
  const originalMock = process.env.VNPAY_MOCK;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.VNPAY_MOCK = originalMock;
  });

  it("should confirm a pending payment as paid", async () => {
    process.env.VNPAY_MOCK = "true";
    mockClinical(true);
    const { service, paymentRepository } = createService(pendingPayment());

    const result = await service.simulateMockPayment(paymentId, receptionist);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(paymentRepository.save).toHaveBeenCalled();
  });

  it("should leave an already-paid payment untouched", async () => {
    process.env.VNPAY_MOCK = "true";
    mockClinical(true);
    const { service, paymentRepository } = createService(paidPayment());

    const result = await service.simulateMockPayment(paymentId, receptionist);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("should reject when mock mode is disabled", async () => {
    process.env.VNPAY_MOCK = "false";
    const { service } = createService(pendingPayment());

    await expect(
      service.simulateMockPayment(paymentId, receptionist),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("PaymentsService.handleVnpayReturn (Confirm Payment)", () => {
  const originalMock = process.env.VNPAY_MOCK;

  afterEach(() => {
    process.env.VNPAY_MOCK = originalMock;
  });

  it("should mark the payment paid on a successful response code", async () => {
    process.env.VNPAY_MOCK = "true";
    const { service, paymentRepository } = createService(pendingPayment());

    const result = await service.handleVnpayReturn({
      vnp_ResponseCode: "00",
      vnp_TxnRef: paymentId,
      vnp_TransactionNo: "TXN123",
    });

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.provider_txn_ref).toBe("TXN123");
    expect(paymentRepository.save).toHaveBeenCalled();
  });

  it("should mark the payment failed on a non-success response code", async () => {
    process.env.VNPAY_MOCK = "true";
    const { service, paymentRepository } = createService(pendingPayment());

    const result = await service.handleVnpayReturn({
      vnp_ResponseCode: "24",
      vnp_TxnRef: paymentId,
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(paymentRepository.save).toHaveBeenCalled();
  });

  it("should throw NotFoundException when the payment reference is unknown", async () => {
    process.env.VNPAY_MOCK = "true";
    const { service } = createService(null);

    await expect(
      service.handleVnpayReturn({
        vnp_ResponseCode: "00",
        vnp_TxnRef: paymentId,
      }),
    ).rejects.toThrow("not found");
  });
});

describe("PaymentsService.findAll (Confirm Payment / View Payment History)", () => {
  it("should list all payments when no status filter is given", async () => {
    const { service, paymentRepository } = createService();
    paymentRepository.find.mockResolvedValue([{ payment_id: paymentId }]);

    const result = await service.findAll();

    expect(paymentRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(result).toEqual([{ payment_id: paymentId }]);
  });

  it("should filter payments by status", async () => {
    const { service, paymentRepository } = createService();
    paymentRepository.find.mockResolvedValue([]);

    await service.findAll(PaymentStatus.PAID);

    expect(paymentRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: PaymentStatus.PAID } }),
    );
  });
});

describe("PaymentsService.rejectRefund (Refund / Cancel Payment)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should reject an under-review refund request and notify the patient", async () => {
    mockClinical(true);
    const { service, paymentRepository, refundNotificationPublisher } =
      createService(paidPayment({ refund_status: RefundStatus.REQUESTED }));

    const result = await service.rejectRefund(
      paymentId,
      { reason: "Missing proof of payment" } as any,
      receptionist,
    );
    await flushPromises();

    expect(result.refund_status).toBe(RefundStatus.REJECTED);
    expect(result.refund_reason).toBe("Missing proof of payment");
    expect(result.refund_reviewed_by).toBe(receptionist.accountId);
    expect(paymentRepository.save).toHaveBeenCalled();
    expect(refundNotificationPublisher.publish).toHaveBeenCalled();
  });

  it("should reject rejecting a refund that is not awaiting review", async () => {
    const { service, paymentRepository } = createService(
      paidPayment({ refund_status: null }),
    );

    await expect(
      service.rejectRefund(
        paymentId,
        { reason: "No open request" } as any,
        receptionist,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });
});

describe("PaymentsService.approveRefund (Refund / Cancel Payment)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should approve an open refund and mark the payment refunded", async () => {
    mockClinical(true);
    const { service, paymentRepository, refundNotificationPublisher } =
      createService(
        paidPayment({
          refund_status: RefundStatus.REQUESTED,
          refund_amount: 500_000,
        }),
      );

    const result = await service.approveRefund(
      paymentId,
      {} as any,
      receptionist,
    );
    await flushPromises();

    expect(result.refund_status).toBe(RefundStatus.REFUNDED);
    expect(result.status).toBe(PaymentStatus.REFUNDED);
    expect(paymentRepository.save).toHaveBeenCalled();
    expect(refundNotificationPublisher.publish).toHaveBeenCalled();
  });
});

describe("PaymentsService.listRefunds", () => {
  it("should list only open/reviewable refunds by default", async () => {
    const { service, paymentRepository } = createService();
    paymentRepository.find.mockResolvedValue([]);

    await service.listRefunds();

    const callArgs = paymentRepository.find.mock.calls[0][0];
    expect(callArgs.where).toHaveProperty("refund_status");
  });

  it("should filter refunds by a specific status", async () => {
    const { service, paymentRepository } = createService();
    paymentRepository.find.mockResolvedValue([]);

    await service.listRefunds(RefundStatus.REJECTED);

    expect(paymentRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { refund_status: RefundStatus.REJECTED },
      }),
    );
  });
});
