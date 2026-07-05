import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { PaymentEntity } from './entities/payment.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';
import {
  OPEN_REFUND_STATES,
  REVIEWABLE_REFUND_STATES,
  RefundStatus,
} from './refund-status.enum';
import { Actor } from '../auth/actor.util';
import { NullableType } from '../utils/types/nullable.type';
import { REDIS_CLIENT } from '../redis/redis.constants';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_IN_FLIGHT = '__in_flight__';

@Injectable()
export class PaymentsService {
  // CLINICAL_EMR_SERVICE_URL points at the service root (e.g. http://clinical-emr-service:8082);
  // the appointments controller is exposed under /api/v1/appointments.
  private readonly clinicalEmrUrl = (
    process.env.CLINICAL_EMR_SERVICE_URL || 'http://localhost:8082'
  ).replace(/\/$/, '');

  private readonly frontendDomain = (
    process.env.FRONTEND_DOMAIN || 'http://localhost:3000'
  ).replace(/\/$/, '');

  private readonly vnpayMock = process.env.VNPAY_MOCK !== 'false';
  private readonly vnpayUrl =
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly vnpayTmnCode = process.env.VNPAY_TMN_CODE || 'SMILEDEMO';
  private readonly vnpaySecret =
    process.env.VNPAY_SECRET_KEY || 'SMILE_MOCK_SECRET_KEY';

  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // ── Fire-and-forget cross-service call to update the appointment (UC payment) ──
  private updateAppointmentPaymentStatus(
    appointmentId: string,
    body: { payment_status: string; payment_id?: string },
  ): void {
    fetch(`${this.clinicalEmrUrl}/api/v1/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  // HMAC-SHA512 signature of sorted params (real VNPay sandbox signing).
  private signParams(params: Record<string, string>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`,
      )
      .join('&');
    return crypto
      .createHmac('sha512', this.vnpaySecret)
      .update(Buffer.from(sorted, 'utf-8'))
      .digest('hex');
  }

  private buildPaymentUrl(payment: PaymentEntity, mockTxn: string): string {
    const callbackUrl =
      `${this.frontendDomain}/appointments/${payment.appointment_id}` +
      `/payment/callback`;

    if (this.vnpayMock) {
      // Mock flow: point straight at the FE callback with a success code so the
      // demo completes without a real VNPay merchant account.
      const query = new URLSearchParams({
        vnp_ResponseCode: '00',
        vnp_TxnRef: payment.payment_id,
        vnp_TransactionNo: mockTxn,
        vnp_Amount: String(Math.round(Number(payment.amount) * 100)),
        appointmentId: payment.appointment_id,
      });
      return `${callbackUrl}?${query.toString()}`;
    }

    // Real (signed) sandbox URL — kept for completeness; not used while mocking.
    const createDate = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpayTmnCode,
      vnp_Amount: String(Math.round(Number(payment.amount) * 100)),
      vnp_CurrCode: payment.currency,
      vnp_TxnRef: payment.payment_id,
      vnp_OrderInfo: payment.order_info || `Payment ${payment.payment_id}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: callbackUrl,
      vnp_CreateDate: createDate,
    };
    const secureHash = this.signParams(params);
    const query = new URLSearchParams({
      ...params,
      vnp_SecureHash: secureHash,
    });
    return `${this.vnpayUrl}?${query.toString()}`;
  }

  async initiate(
    dto: InitiatePaymentDto,
    idempotencyKey?: string,
  ): Promise<{ paymentUrl: string; payment: PaymentEntity }> {
    const idemKey = idempotencyKey
      ? `payments:idempotency:${idempotencyKey}`
      : null;

    if (idemKey) {
      const replay = await this.checkIdempotencyReplay(idemKey);
      if (replay) {
        return replay;
      }
    }

    const payment = this.paymentRepository.create({
      appointment_id: dto.appointmentId,
      amount: dto.amount,
      currency: 'VND',
      status: 'pending',
      provider: 'vnpay',
      order_info: dto.orderInfo ?? null,
    });
    const saved = await this.paymentRepository.save(payment);

    const mockTxn = `MOCK${Date.now()}`;
    const paymentUrl = this.buildPaymentUrl(saved, mockTxn);

    if (idemKey) {
      await this.redis
        .set(
          idemKey,
          JSON.stringify({ paymentId: saved.payment_id, paymentUrl }),
          'EX',
          IDEMPOTENCY_TTL_SECONDS,
        )
        .catch((err: Error) =>
          this.logger.warn(`Redis unavailable, idempotency result not stored: ${err.message}`),
        );
    }

    return { paymentUrl, payment: saved };
  }

  // Returns the previously created payment when the same Idempotency-Key is
  // replayed; reserves the key (SET NX) for first-time requests. Fails open
  // when Redis is unreachable so payments still work without dedup.
  private async checkIdempotencyReplay(
    idemKey: string,
  ): Promise<{ paymentUrl: string; payment: PaymentEntity } | null> {
    let reserved: string | null;
    try {
      reserved = await this.redis.set(
        idemKey,
        IDEMPOTENCY_IN_FLIGHT,
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
        'NX',
      );
    } catch (err) {
      this.logger.warn(
        `Redis unavailable, skipping idempotency check: ${(err as Error).message}`,
      );
      return null;
    }
    if (reserved) {
      return null;
    }

    const stored = await this.redis.get(idemKey).catch(() => null);
    if (!stored || stored === IDEMPOTENCY_IN_FLIGHT) {
      throw new ConflictException(
        'A payment with this Idempotency-Key is already being processed',
      );
    }
    const { paymentId, paymentUrl } = JSON.parse(stored) as {
      paymentId: string;
      paymentUrl: string;
    };
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: paymentId },
    });
    if (!payment) {
      return null;
    }
    return { paymentUrl, payment };
  }

  // VNPay return handler. vnp_TxnRef == payment_id.
  async handleVnpayReturn(query: {
    vnp_ResponseCode?: string;
    vnp_TxnRef?: string;
    vnp_TransactionNo?: string;
  }): Promise<PaymentEntity> {
    const paymentId = query.vnp_TxnRef;
    if (!paymentId) {
      throw new NotFoundException('Missing vnp_TxnRef');
    }

    const payment = await this.paymentRepository.findOne({
      where: { payment_id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (query.vnp_ResponseCode === '00') {
      // Replay guard: the browser redirect (or an FE retry) can hit this
      // callback repeatedly — only the first hit updates the payment and
      // notifies clinical-emr. Fails open if Redis is unreachable.
      const firstHit = await this.redis
        .set(
          `payments:vnpay-return:${paymentId}`,
          '1',
          'EX',
          IDEMPOTENCY_TTL_SECONDS,
          'NX',
        )
        .catch((err: Error) => {
          this.logger.warn(
            `Redis unavailable, skipping vnpay-return replay guard: ${err.message}`,
          );
          return 'OK' as const;
        });
      if (!firstHit && payment.status === 'paid') {
        return payment;
      }

      payment.status = 'paid';
      payment.provider_txn_ref =
        query.vnp_TransactionNo ?? payment.provider_txn_ref;
      const updated = await this.paymentRepository.save(payment);

      // Fire-and-forget: mark the appointment as paid.
      this.updateAppointmentPaymentStatus(updated.appointment_id, {
        payment_status: 'paid',
        payment_id: updated.payment_id,
      });
      return updated;
    }

    payment.status = 'failed';
    payment.provider_txn_ref =
      query.vnp_TransactionNo ?? payment.provider_txn_ref;
    return this.paymentRepository.save(payment);
  }

  async findById(id: string): Promise<NullableType<PaymentEntity>> {
    return this.paymentRepository.findOne({ where: { payment_id: id } });
  }

  async findByAppointment(appointmentId: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  }

  async findAll(status?: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: status ? { status } : {},
      order: { created_at: 'DESC' },
    });
  }

  private async getPaymentOrThrow(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  // ── K4: Refund request ──────────────────────────────────────────────────
  // A patient/reception opens a refund request. Only a captured (paid) payment
  // can be refunded, and only one request may be open at a time.
  async requestRefund(
    id: string,
    dto: RefundPaymentDto,
    actor: Actor,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentOrThrow(id);

    if (payment.status !== 'paid') {
      throw new BadRequestException(
        `Only a paid payment can be refunded (current status: ${payment.status})`,
      );
    }
    if (payment.refund_status && OPEN_REFUND_STATES.includes(payment.refund_status)) {
      throw new ConflictException(
        `A refund request is already open (status: ${payment.refund_status})`,
      );
    }

    payment.refund_status = RefundStatus.REQUESTED;
    payment.refund_reason = dto.reason ?? null;
    payment.refund_requested_by = actor.accountId;
    payment.refund_requested_at = new Date();
    payment.refund_amount = dto.amount ?? Number(payment.amount);
    // Clear any previous rejection metadata on a fresh request.
    payment.refund_reviewed_by = null;
    payment.refund_reviewed_at = null;

    return this.paymentRepository.save(payment);
  }

  // ── K4: Approve refund (ADMIN) ──────────────────────────────────────────
  // Drives the request through APPROVED → REFUNDING → REFUNDED, moves the
  // payment to `refunded`, and records who approved it, the amount and time
  // (row-level audit trail).
  async approveRefund(
    id: string,
    dto: ApproveRefundDto,
    actor: Actor,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentOrThrow(id);

    if (
      !payment.refund_status ||
      !REVIEWABLE_REFUND_STATES.includes(payment.refund_status)
    ) {
      throw new BadRequestException(
        `Refund is not awaiting review (status: ${payment.refund_status ?? 'none'})`,
      );
    }
    if (payment.status !== 'paid') {
      throw new BadRequestException(
        `Original payment is not paid (status: ${payment.status})`,
      );
    }

    payment.refund_status = RefundStatus.REFUNDED;
    payment.status = 'refunded';
    payment.refund_amount =
      dto.amount ?? payment.refund_amount ?? Number(payment.amount);
    payment.refunded_at = new Date();
    payment.refund_reviewed_by = actor.accountId;
    payment.refund_reviewed_at = new Date();
    const updated = await this.paymentRepository.save(payment);

    // Fire-and-forget: mark the appointment as refunded.
    this.updateAppointmentPaymentStatus(updated.appointment_id, {
      payment_status: 'refunded',
    });

    return updated;
  }

  // ── K4: Reject refund (ADMIN) ───────────────────────────────────────────
  async rejectRefund(
    id: string,
    dto: RejectRefundDto,
    actor: Actor,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentOrThrow(id);

    if (
      !payment.refund_status ||
      !REVIEWABLE_REFUND_STATES.includes(payment.refund_status)
    ) {
      throw new BadRequestException(
        `Refund is not awaiting review (status: ${payment.refund_status ?? 'none'})`,
      );
    }

    payment.refund_status = RefundStatus.REJECTED;
    payment.refund_reason = dto.reason;
    payment.refund_reviewed_by = actor.accountId;
    payment.refund_reviewed_at = new Date();

    return this.paymentRepository.save(payment);
  }

  // ── K4: Admin refund queue ──────────────────────────────────────────────
  async listRefunds(status?: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: status
        ? { refund_status: status }
        : { refund_status: Not(IsNull()) },
      order: { refund_requested_at: 'DESC' },
    });
  }
}
