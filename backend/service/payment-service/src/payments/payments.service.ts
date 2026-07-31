import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import {
  RefundNotificationPublisher,
  RefundNotificationType,
} from './refund-notification.publisher';
import { Currency, PaymentStatus } from './payment-status.enum';
import { getSanitizedErrorMetadata } from './payment-error-metadata';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
// Staff who may look at any payment. Everyone else must own the appointment
// the payment belongs to.
const PAYMENT_STAFF_ROLES = new Set(['ADMIN', 'MANAGER', 'RECEPTIONIST']);
const IDEMPOTENCY_IN_FLIGHT = '__in_flight__';

export { getSanitizedErrorMetadata } from './payment-error-metadata';

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
    private readonly refundNotificationPublisher: RefundNotificationPublisher,
  ) {}

  // Mints a short-lived HS256 JWT matching clinical-emr's actor.util.ts verification
  // (header {alg:'HS256'}, payload {accountId, role, exp}, base64url-encoded, HMAC-SHA256
  // over header.payload with the shared AUTH_JWT_SECRET). This token is the sole
  // identity for internal calls — clinical-emr ignores x-auth-* headers entirely.
  private mintSystemActorToken(): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      accountId: '00000000-0000-0000-0000-000000000000',
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) + 300,
    };
    const encode = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${encode(header)}.${encode(payload)}`;
    const signature = crypto
      .createHmac('sha256', process.env.AUTH_JWT_SECRET || '')
      .update(signingInput)
      .digest('base64url');
    return `${signingInput}.${signature}`;
  }

  // ── Fire-and-forget cross-service call to update the appointment (UC payment) ──
  private updateAppointmentPaymentStatus(
    appointmentId: string,
    body: { payment_status: string; payment_id?: string },
  ): void {
    // Identify as a system actor: the minted token carries accountId=<nil UUID>
    // and role=ADMIN, so clinical-emr's ownership checks take the staff path.
    // The nil UUID matches no patient record by design.
    fetch(`${this.clinicalEmrUrl}/api/v1/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.mintSystemActorToken()}`,
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          this.logger.warn(
            `operation=appointment_payment_status_sync outcome=rejected error_class=HttpError http_status=${res.status}`,
          );
        }
      })
      .catch((error: unknown) => {
        const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
        this.logger.warn(
          `operation=appointment_payment_status_sync outcome=failed error_class=${errorClass} error_code=${errorCode}`,
        );
      });
  }

  // ── Fire-and-forget: notify the patient of a refund review outcome ──────
  // PaymentEntity has no patient id (refund_requested_by may be staff), so the
  // appointment is looked up first to resolve the recipient. Never awaited and
  // never throws — the refund flow must not depend on this hop.
  private notifyRefundOutcome(
    payment: PaymentEntity,
    type: RefundNotificationType,
    reason?: string,
  ): void {
    fetch(`${this.clinicalEmrUrl}/api/v1/appointments/${payment.appointment_id}`, {
      headers: {
        Authorization: `Bearer ${this.mintSystemActorToken()}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          this.logger.warn(
            `operation=refund_notification_recipient_lookup outcome=rejected error_class=HttpError http_status=${res.status}`,
          );
          return;
        }
        const body = (await res.json()) as {
          patient_id?: string;
          data?: { patient_id?: string };
        };
        const patientId = body?.data?.patient_id ?? body?.patient_id;
        if (!patientId) throw new Error('appointment response had no patient_id');
        const amount = Number(payment.refund_amount ?? payment.amount);
        this.refundNotificationPublisher.publish({
          recipientId: patientId,
          notificationType: type,
          paymentId: payment.payment_id,
          subject:
            type === 'REFUND_APPROVED' ? 'Refund approved' : 'Refund request rejected',
          message:
            type === 'REFUND_APPROVED'
              ? `Your refund of ${amount.toLocaleString()} VND has been approved and processed.`
              : `Your refund request was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        });
      })
      .catch((error: unknown) => {
        const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
        this.logger.warn(
          `operation=refund_notification_recipient_lookup outcome=failed error_class=${errorClass} error_code=${errorCode}`,
        );
      });
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

  private formatVnpayDate(timestamp: number): string {
    const vietnamTime = new Date(timestamp + 7 * 60 * 60 * 1000);
    return [
      vietnamTime.getUTCFullYear(),
      String(vietnamTime.getUTCMonth() + 1).padStart(2, '0'),
      String(vietnamTime.getUTCDate()).padStart(2, '0'),
      String(vietnamTime.getUTCHours()).padStart(2, '0'),
      String(vietnamTime.getUTCMinutes()).padStart(2, '0'),
      String(vietnamTime.getUTCSeconds()).padStart(2, '0'),
    ].join('');
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

    // Real (signed) sandbox URL. VNPay requires vnp_CreateDate/vnp_ExpireDate
    // as yyyyMMddHHmmss in GMT+7 and rejects requests missing vnp_IpAddr.
    const now = Date.now();
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
      vnp_IpAddr: '127.0.0.1',
      vnp_ReturnUrl: callbackUrl,
      vnp_CreateDate: this.formatVnpayDate(now),
      vnp_ExpireDate: this.formatVnpayDate(now + 15 * 60 * 1000),
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
    actor: Actor,
    authorization?: string,
    idempotencyKey?: string,
  ): Promise<{ paymentUrl: string; payment: PaymentEntity }> {
    await this.assertAppointmentAccess(
      dto.appointmentId,
      actor,
      authorization,
    );

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
      currency: Currency.VND,
      status: PaymentStatus.PENDING,
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
        .catch((error: unknown) => {
          const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
          this.logger.warn(
            `operation=redis_idempotency_store outcome=failed error_class=${errorClass} error_code=${errorCode}`,
          );
        });
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
    } catch (error) {
      const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
      this.logger.warn(
        `operation=redis_idempotency_check outcome=failed error_class=${errorClass} error_code=${errorCode}`,
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
  // In real (non-mock) mode the full query string must carry a valid
  // vnp_SecureHash — otherwise anyone could forge a "paid" callback.
  async handleVnpayReturn(
    query: {
      vnp_ResponseCode?: string;
      vnp_TxnRef?: string;
      vnp_TransactionNo?: string;
    },
    rawQuery?: Record<string, string>,
  ): Promise<PaymentEntity> {
    if (!this.vnpayMock) {
      const { vnp_SecureHash, vnp_SecureHashType, ...rest } = rawQuery ?? {};
      void vnp_SecureHashType;
      // VNPay omits empty params from its own signature input.
      const signable = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined && v !== ''),
      );
      const expected = this.signParams(signable);
      if (
        !vnp_SecureHash ||
        vnp_SecureHash.length !== expected.length ||
        !crypto.timingSafeEqual(
          Buffer.from(vnp_SecureHash.toLowerCase(), 'utf-8'),
          Buffer.from(expected, 'utf-8'),
        )
      ) {
        throw new BadRequestException('Invalid VNPay signature');
      }
    }

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
        .catch((error: unknown) => {
          const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
          this.logger.warn(
            `operation=redis_vnpay_replay_guard outcome=failed error_class=${errorClass} error_code=${errorCode}`,
          );
          return 'OK' as const;
        });
      if (!firstHit && payment.status === PaymentStatus.PAID) {
        return payment;
      }

      payment.status = PaymentStatus.PAID;
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

    payment.status = PaymentStatus.FAILED;
    payment.provider_txn_ref =
      query.vnp_TransactionNo ?? payment.provider_txn_ref;
    const failed = await this.paymentRepository.save(payment);

    // Fire-and-forget: tell clinical-emr the payment did not go through, so a
    // previously-completed appointment (e.g. a retried/duplicate callback racing
    // an earlier success) rolls back instead of being left "completed but unpaid".
    this.updateAppointmentPaymentStatus(failed.appointment_id, {
      payment_status: 'unpaid',
    });
    return failed;
  }

  async findById(id: string): Promise<NullableType<PaymentEntity>> {
    return this.paymentRepository.findOne({ where: { payment_id: id } });
  }

  async findByIdForActor(
    id: string,
    actor: Actor,
    authorization?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentOrThrow(id);
    await this.assertAppointmentAccess(
      payment.appointment_id,
      actor,
      authorization,
    );
    return payment;
  }

  async findByAppointment(
    appointmentId: string,
    actor: Actor,
    authorization?: string,
  ): Promise<PaymentEntity[]> {
    await this.assertAppointmentAccess(appointmentId, actor, authorization);
    return this.paymentRepository.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  }

  async findAll(status?: PaymentStatus): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: status ? { status } : {},
      order: { created_at: 'DESC' },
    });
  }

  private isPaymentStaff(actor: Actor): boolean {
    return PAYMENT_STAFF_ROLES.has(actor.role?.trim().toUpperCase() ?? '');
  }

  /**
   * A payment row carries no patient id, so ownership is decided by whether
   * the caller can read the appointment it belongs to. We re-use the caller's
   * own bearer token for that hop, which means clinical-emr's existing
   * row-level ownership rules are the single source of truth instead of a
   * second, drifting copy here.
   */
  private async assertAppointmentAccess(
    appointmentId: string,
    actor: Actor,
    authorization: string | undefined,
  ): Promise<void> {
    if (this.isPaymentStaff(actor)) {
      return;
    }
    if (!authorization) {
      throw new ForbiddenException('You may not access this payment');
    }

    let response: Response;
    try {
      response = await fetch(
        `${this.clinicalEmrUrl}/api/v1/appointments/${appointmentId}`,
        { headers: { Authorization: authorization } },
      );
    } catch (error: unknown) {
      const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
      this.logger.warn(
        `operation=payment_ownership_check outcome=failed error_class=${errorClass} error_code=${errorCode}`,
      );
      throw new ForbiddenException('Unable to verify payment ownership');
    }

    if (!response.ok) {
      throw new ForbiddenException('You may not access this payment');
    }
  }

  private assertRefundAmountWithinCapture(
    payment: PaymentEntity,
    amount: number | undefined,
  ): number {
    const captured = Number(payment.amount);
    const requested = amount ?? captured;

    if (!Number.isFinite(requested) || requested <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }
    if (requested > captured) {
      throw new BadRequestException(
        'Refund amount may not exceed the captured amount',
      );
    }
    return requested;
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
    authorization?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentOrThrow(id);
    await this.assertAppointmentAccess(
      payment.appointment_id,
      actor,
      authorization,
    );

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
    payment.refund_amount = this.assertRefundAmountWithinCapture(
      payment,
      dto.amount,
    );
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
    payment.status = PaymentStatus.REFUNDED;
    payment.refund_amount = this.assertRefundAmountWithinCapture(
      payment,
      dto.amount ?? payment.refund_amount ?? undefined,
    );
    payment.refunded_at = new Date();
    payment.refund_reviewed_by = actor.accountId;
    payment.refund_reviewed_at = new Date();
    const updated = await this.paymentRepository.save(payment);

    // Fire-and-forget: mark the appointment as refunded.
    this.updateAppointmentPaymentStatus(updated.appointment_id, {
      payment_status: 'refunded',
    });
    this.notifyRefundOutcome(updated, 'REFUND_APPROVED');

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

    const saved = await this.paymentRepository.save(payment);
    this.notifyRefundOutcome(saved, 'REFUND_REJECTED', dto.reason);
    return saved;
  }

  // ── K4: Admin refund queue ──────────────────────────────────────────────
  async listRefunds(status?: RefundStatus): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: status
        ? { refund_status: status }
        : { refund_status: Not(IsNull()) },
      order: { refund_requested_at: 'DESC' },
    });
  }
}
