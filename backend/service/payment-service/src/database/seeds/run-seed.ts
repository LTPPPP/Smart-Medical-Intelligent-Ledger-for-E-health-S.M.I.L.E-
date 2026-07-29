import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { AppDataSource } from "../data-source";
import { PaymentEntity } from "../../payments/entities/payment.entity";
import { Currency, PaymentStatus } from "../../payments/payment-status.enum";
import { getSanitizedErrorMetadata } from "../../payments/payment-error-metadata";

/**
 * Mirrors the paid appointments in Clinical's deterministic 30-row demo seed.
 * IDs and amounts stay aligned across service databases without a cross-DB FK.
 */
const SERVICE_AMOUNTS = [
  200000, // General Dental Examination
  300000, // Dental Scaling
  500000, // Dental Filling
  1200000, // Root Canal Treatment
  800000, // Tooth Extraction
  3000000, // Teeth Whitening
  5000000, // Porcelain Crown
  15000000, // Dental Implant
  30000000, // Orthodontic Braces
  100000, // Treatment Consultation
];

const PAID_APPOINTMENT_INDEXES = Array.from(
  { length: 22 },
  (_, index) => index,
).filter((index) => index % 9 !== 4 && index % 9 !== 7 && index % 5 !== 0);

interface DemoPaymentSeed {
  appointmentCode: string;
  payment: Partial<PaymentEntity>;
}

const SAMPLE_PAYMENTS: DemoPaymentSeed[] = PAID_APPOINTMENT_INDEXES.map(
  (index) => {
    const sequence = String(index + 1).padStart(2, "0");
    const appointmentCode = String(index + 1).padStart(4, "0");

    return {
      appointmentCode: `APT-2026-${appointmentCode}`,
      payment: {
        payment_id: `a6000000-0000-0000-0000-0000000000${sequence}`,
        amount: SERVICE_AMOUNTS[index % SERVICE_AMOUNTS.length],
        currency: Currency.VND,
        status: PaymentStatus.PAID,
        provider: "vnpay",
        provider_txn_ref: `MOCK-APT-2026-${appointmentCode}`,
        order_info: `Paid dental appointment APT-2026-${appointmentCode}`,
      },
    };
  },
);

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

async function runSeed() {
  try {
    const dataSource = await AppDataSource.initialize();
    await clinicalDataSource.initialize();
    const repo = dataSource.getRepository(PaymentEntity);
    const appointmentCodes = SAMPLE_PAYMENTS.map(
      ({ appointmentCode }) => appointmentCode,
    );
    const appointments = (await clinicalDataSource.query(
      `SELECT appointment_id, appointment_code
       FROM appointments
       WHERE appointment_code = ANY($1::text[])`,
      [appointmentCodes],
    )) as Array<{ appointment_id: string; appointment_code: string }>;
    const appointmentIds = new Map(
      appointments.map((appointment) => [
        appointment.appointment_code,
        appointment.appointment_id,
      ]),
    );

    if (appointmentIds.size !== SAMPLE_PAYMENTS.length) {
      const error = new Error("Required demo appointments are unavailable");
      error.name = "SeedDependencyError";
      throw error;
    }

    for (const sample of SAMPLE_PAYMENTS) {
      await repo.save(
        repo.create({
          ...sample.payment,
          appointment_id: appointmentIds.get(sample.appointmentCode),
        }),
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `Upserted ${SAMPLE_PAYMENTS.length} linked English demo payments.`,
    );
  } catch (error) {
    const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
    // eslint-disable-next-line no-console
    console.error("Payment seed failed", {
      operation: "seed_demo_payments",
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
