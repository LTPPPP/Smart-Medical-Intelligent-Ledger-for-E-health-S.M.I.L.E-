import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { Currency, PaymentStatus } from '../../payments/payment-status.enum';

/**
 * Idempotent seed: inserts 2-3 sample paid payments with FIXED uuids.
 *
 * NOTE: These appointment_ids are placeholder/fixed UUIDs. The clinical-emr
 * service does NOT seed appointments with fixed UUIDs, so these will not match
 * real appointment rows. For an end-to-end demo, replace the appointment_id
 * values below with real appointment UUIDs from core_medical_service_db.
 */
const SAMPLE_PAYMENTS: Partial<PaymentEntity>[] = [
  {
    payment_id: '11111111-1111-1111-1111-111111111111',
    appointment_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    amount: 200000,
    currency: Currency.VND,
    status: PaymentStatus.PAID,
    provider: 'vnpay',
    provider_txn_ref: 'MOCK-SEED-0001',
    order_info: 'Sample paid consultation fee',
  },
  {
    payment_id: '22222222-2222-2222-2222-222222222222',
    appointment_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    amount: 350000,
    currency: Currency.VND,
    status: PaymentStatus.PAID,
    provider: 'vnpay',
    provider_txn_ref: 'MOCK-SEED-0002',
    order_info: 'Sample paid dental cleaning',
  },
  {
    payment_id: '33333333-3333-3333-3333-333333333333',
    appointment_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    amount: 500000,
    currency: Currency.VND,
    status: PaymentStatus.PAID,
    provider: 'vnpay',
    provider_txn_ref: 'MOCK-SEED-0003',
    order_info: 'Sample paid treatment deposit',
  },
];

async function runSeed() {
  const dataSource = await AppDataSource.initialize();
  const repo = dataSource.getRepository(PaymentEntity);

  for (const sample of SAMPLE_PAYMENTS) {
    const existing = await repo.findOne({
      where: { payment_id: sample.payment_id },
    });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`Payment ${sample.payment_id} already exists, skipping.`);
      continue;
    }
    await repo.save(repo.create(sample));
    // eslint-disable-next-line no-console
    console.log(`Inserted sample payment ${sample.payment_id}.`);
  }

  // eslint-disable-next-line no-console
  console.log(
    'NOTE: sample appointment_ids are placeholders and do not match real ' +
      'appointments. Replace them with real appointment UUIDs for an E2E demo.',
  );

  await dataSource.destroy();
}

void runSeed();
