import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PaymentEntity } from './entities/payment.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { NullableType } from '../utils/types/nullable.type';

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

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
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
  ): Promise<{ paymentUrl: string; payment: PaymentEntity }> {
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

    return { paymentUrl, payment: saved };
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

  async refund(id: string, dto: RefundPaymentDto): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    payment.status = 'refunded';
    payment.refund_amount = dto.amount ?? Number(payment.amount);
    payment.refunded_at = new Date();
    if (dto.reason) {
      payment.order_info = `${payment.order_info ?? ''} | Refund: ${dto.reason}`;
    }
    const updated = await this.paymentRepository.save(payment);

    // Fire-and-forget: mark the appointment as refunded.
    this.updateAppointmentPaymentStatus(updated.appointment_id, {
      payment_status: 'refunded',
    });

    return updated;
  }
}
