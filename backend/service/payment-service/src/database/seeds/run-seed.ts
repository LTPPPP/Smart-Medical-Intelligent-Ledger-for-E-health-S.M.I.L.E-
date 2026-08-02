import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { AppDataSource } from "../data-source";
import { PaymentEntity } from "../../payments/entities/payment.entity";
import { Currency, PaymentStatus } from "../../payments/payment-status.enum";
import { RefundStatus } from "../../payments/refund-status.enum";
import { getSanitizedErrorMetadata } from "../../payments/payment-error-metadata";

const EXPECTED_APPOINTMENT_COUNT = 240;
const ADMIN_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

interface ClinicalAppointment {
  appointment_id: string;
  appointment_code: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  amount: string | null;
}

interface PaymentPlan {
  status: PaymentStatus;
  clinicalStatus: "unpaid" | "paid" | "refunded";
  refundStatus: RefundStatus | null;
  refundReason: string | null;
}

const clinicalDataSource = new DataSource({
  type: "postgres",
  host: process.env.CLINICAL_DATABASE_HOST || process.env.DATABASE_HOST,
  port: parseInt(
    process.env.CLINICAL_DATABASE_PORT || process.env.DATABASE_PORT || "5432",
    10,
  ),
  username:
    process.env.CLINICAL_DATABASE_USERNAME || process.env.DATABASE_USERNAME,
  password:
    process.env.CLINICAL_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.CLINICAL_DATABASE_NAME || "core_clinic_service_db",
  synchronize: false,
  logging: false,
});

function sequenceFromCode(appointmentCode: string): number {
  const sequence = Number(appointmentCode.slice(-4));
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Appointment code does not contain a valid sequence");
  }
  return sequence;
}

function buildPaymentPlan(
  appointmentStatus: string,
  sequence: number,
): PaymentPlan {
  if (appointmentStatus === "cancelled") {
    if (sequence % 2 === 0) {
      return {
        status: PaymentStatus.REFUNDED,
        clinicalStatus: "refunded",
        refundStatus: RefundStatus.REFUNDED,
        refundReason: "Appointment cancelled before treatment was delivered.",
      };
    }

    return {
      status: PaymentStatus.FAILED,
      clinicalStatus: "unpaid",
      refundStatus: null,
      refundReason: null,
    };
  }

  if (appointmentStatus === "scheduled" || appointmentStatus === "confirmed") {
    if (sequence % 5 === 0) {
      return {
        status: PaymentStatus.PAID,
        clinicalStatus: "paid",
        refundStatus: null,
        refundReason: null,
      };
    }

    return {
      status: PaymentStatus.PENDING,
      clinicalStatus: "unpaid",
      refundStatus: null,
      refundReason: null,
    };
  }

  if (appointmentStatus === "completed" && sequence % 19 === 0) {
    return {
      status: PaymentStatus.PAID,
      clinicalStatus: "paid",
      refundStatus: RefundStatus.REQUESTED,
      refundReason: "Patient requested a review of the final treatment charge.",
    };
  }

  if (appointmentStatus === "completed" && sequence % 4 === 0) {
    return {
      status: PaymentStatus.PENDING,
      clinicalStatus: "unpaid",
      refundStatus: null,
      refundReason: null,
    };
  }

  return {
    status: PaymentStatus.PAID,
    clinicalStatus: "paid",
    refundStatus: null,
    refundReason: null,
  };
}

function appointmentTimestamp(appointment: ClinicalAppointment): Date {
  const time = appointment.appointment_time.slice(0, 8);
  const timestamp = new Date(
    `${appointment.appointment_date}T${time || "09:00:00"}+07:00`,
  );
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Appointment date and time are invalid");
  }
  return timestamp;
}

function buildPayment(appointment: ClinicalAppointment): {
  entity: PaymentEntity;
  clinicalStatus: PaymentPlan["clinicalStatus"];
} {
  const sequence = sequenceFromCode(appointment.appointment_code);
  const paddedSequence = String(sequence).padStart(12, "0");
  const paymentId = `a6000000-0000-4000-8000-${paddedSequence}`;
  const plan = buildPaymentPlan(appointment.appointment_status, sequence);
  const appointmentAt = appointmentTimestamp(appointment);
  const createdAt = new Date(appointmentAt.getTime() - 7 * 24 * 60 * 60 * 1000);
  const requestedAt = plan.refundStatus
    ? new Date(appointmentAt.getTime() + 24 * 60 * 60 * 1000)
    : null;
  const isFinalRefund = plan.refundStatus === RefundStatus.REFUNDED;
  const providerReference =
    plan.status === PaymentStatus.PENDING
      ? null
      : plan.status === PaymentStatus.FAILED
        ? `VNPAY-DECLINED-2026-${String(sequence).padStart(6, "0")}`
        : `VNPAY-2026-${String(sequence).padStart(8, "0")}`;

  return {
    entity: AppDataSource.getRepository(PaymentEntity).create({
      payment_id: paymentId,
      appointment_id: appointment.appointment_id,
      amount: Number(appointment.amount),
      currency: Currency.VND,
      status: plan.status,
      provider: "vnpay",
      provider_txn_ref: providerReference,
      order_info: `Dental care payment for ${appointment.appointment_code}`,
      refund_amount: isFinalRefund ? Number(appointment.amount) : null,
      refunded_at: isFinalRefund
        ? new Date(appointmentAt.getTime() + 2 * 24 * 60 * 60 * 1000)
        : null,
      refund_status: plan.refundStatus,
      refund_reason: plan.refundReason,
      refund_requested_by: plan.refundStatus ? appointment.patient_id : null,
      refund_requested_at: requestedAt,
      refund_reviewed_by: isFinalRefund ? ADMIN_USER_ID : null,
      refund_reviewed_at: isFinalRefund
        ? new Date(appointmentAt.getTime() + 36 * 60 * 60 * 1000)
        : null,
      created_at: createdAt,
      updated_at: isFinalRefund
        ? new Date(appointmentAt.getTime() + 2 * 24 * 60 * 60 * 1000)
        : createdAt,
    }),
    clinicalStatus: plan.clinicalStatus,
  };
}

async function runSeed() {
  try {
    await AppDataSource.initialize();
    await clinicalDataSource.initialize();

    const appointments = (await clinicalDataSource.query(
      `SELECT
         appointment.appointment_id,
         appointment.appointment_code,
         appointment.patient_id,
         appointment.appointment_date::text AS appointment_date,
         appointment.appointment_time::text AS appointment_time,
         appointment.status AS appointment_status,
         service.base_price::text AS amount
       FROM appointments appointment
       INNER JOIN services service
         ON service.service_id = appointment.service_id
       WHERE appointment.appointment_code LIKE 'APT-2026-%'
       ORDER BY appointment.appointment_code`,
    )) as ClinicalAppointment[];

    if (appointments.length !== EXPECTED_APPOINTMENT_COUNT) {
      const error = new Error(
        `Expected ${EXPECTED_APPOINTMENT_COUNT} canonical appointments`,
      );
      error.name = "SeedDependencyError";
      throw error;
    }

    if (appointments.some((appointment) => Number(appointment.amount) <= 0)) {
      const error = new Error("Every appointment must have a priced service");
      error.name = "SeedDependencyError";
      throw error;
    }

    const payments = appointments.map(buildPayment);
    const paymentRepository = AppDataSource.getRepository(PaymentEntity);
    await paymentRepository.save(
      payments.map(({ entity }) => entity),
      { chunk: 50 },
    );

    for (let index = 0; index < appointments.length; index += 1) {
      await clinicalDataSource.query(
        `UPDATE appointments
         SET payment_id = $1,
             payment_status = $2,
             updated_at = NOW()
         WHERE appointment_id = $3`,
        [
          payments[index].entity.payment_id,
          payments[index].clinicalStatus,
          appointments[index].appointment_id,
        ],
      );
    }

    const statusCounts = payments.reduce<Record<string, number>>(
      (counts, { entity }) => {
        counts[entity.status] = (counts[entity.status] ?? 0) + 1;
        if (entity.refund_status === RefundStatus.REQUESTED) {
          counts.refund_requested = (counts.refund_requested ?? 0) + 1;
        }
        return counts;
      },
      {},
    );

    // eslint-disable-next-line no-console
    console.log("Upserted linked English payment history.", {
      total: payments.length,
      ...statusCounts,
    });
  } catch (error) {
    const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
    // eslint-disable-next-line no-console
    console.error("Payment seed failed", {
      operation: "seed_linked_payments",
      error_class: errorClass,
      error_code: errorCode,
    });
    process.exitCode = 1;
  } finally {
    if (clinicalDataSource.isInitialized) await clinicalDataSource.destroy();
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

void runSeed();
