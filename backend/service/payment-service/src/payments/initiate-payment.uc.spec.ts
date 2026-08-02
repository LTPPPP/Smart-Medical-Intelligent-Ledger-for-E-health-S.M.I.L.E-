// GENERATED from Report5_Unit Test.xlsx — sheet "Initiate Payment" — 2 cases. Do not hand-edit.
//
// Target : PaymentsService.initiate() — src/payments/payments.service.ts:232
// Symbol : MISMAPPED (docs/audit/qa-recon-symbols.json)
// Split  : 1 DTO-validation case (UTCID02) / 1 service-behaviour case (UTCID01)
// Spec   : 0 of 2 MATCHES, 2 of 2 DIVERGES — a 100%-divergence sheet.
//
// The sheet names KycVerificationsService.findOne() as the class under test — a KYC read in
// iam-service, an unrelated feature. The mismapping is not cosmetic: the sheet's inputs and
// expected results were authored against that wrong function, so BOTH cases describe
// something this code never did.
//   UTCID01 SPEC_WRONG — expects a KycVerificationEntity; initiate() returns
//           { paymentUrl, payment }.
//   UTCID02 SPEC_WRONG — asserts on a field `id` that InitiatePaymentDto does not have (the
//           real identifier is appointmentId), and expects 400 where this service answers 422.
// See docs/audit/uc-divergences.md D3.1-D3.2.
//
// ACTOR CHOICE — why PATIENT, not staff:
// "Patient initiates payment" is not merely a defensible reading — it is the flow verified
// live in Session 3 (patient10 -> mock VNPay -> callback -> payment=paid, evidence
// docs/audit/evidence/PATIENT-08-A9-payment-success.png). Empirical evidence outranks an
// unstated sheet column. The sheet has NO actor column at all; choosing staff would have been
// chosen for test convenience (it short-circuits the ownership check) rather than for
// fidelity to the product, so the patient path is asserted instead.
//
// OUTBOUND CALL STUBBING: for a non-staff actor, initiate() -> assertAppointmentAccess()
// performs a BARE GLOBAL fetch() to clinical-emr (payments.service.ts:479) — there is no
// injected HTTP client to substitute. global.fetch is therefore replaced in beforeEach and
// restored in afterEach so the unit test never touches the network.

import {
  HttpException,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
// The service's OWN options object — imported, never re-declared, so these tests track
// config changes instead of drifting from them.
import validationOptions from '../utils/validation-options';
// Distinct id per entity kind, guarded against collision at import time (defect T1).
import { UC_IDS } from '../test-support/uc-fixtures';

const validationPipe = new ValidationPipe(validationOptions);

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: InitiatePaymentDto,
    data: '',
  });
}

/** Runs the pipe and returns the rejection's HTTP status + body, or fails if it resolves. */
async function capturePipeRejection(payload: Record<string, unknown>) {
  let caught: unknown;
  let resolved = false;
  try {
    await runPipe(payload);
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) {
    throw new Error('expected ValidationPipe to reject, but it resolved');
  }
  const httpError = caught as HttpException;
  return {
    error: httpError,
    status: httpError.getStatus(),
    body: httpError.getResponse() as { status?: number; errors?: Record<string, string> },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const APPOINTMENT_ID = UC_IDS.appointment;
const PAYMENT_ID = UC_IDS.payment;
const AMOUNT = 200000;
const BEARER = 'Bearer patient-access-token';

// --- Inferred mock state (rule D: every inference named and sourced) ---

// INFERRED from the live-verified patient payment flow (see ACTOR CHOICE above), not from the
// sheet — the sheet has no actor column. PATIENT is not in PAYMENT_STAFF_ROLES, so
// assertAppointmentAccess() takes the ownership-check branch requiring a bearer token.
const INFERRED_PATIENT_ACTOR = { accountId: UC_IDS.actorUser, role: 'PATIENT' };

const originalFetch = global.fetch;

beforeEach(() => {
  // clinical-emr answers 200 => the caller may read the appointment => access granted.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function createService() {
  const paymentRepository = {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve({ ...value, payment_id: PAYMENT_ID })),
    findOne: jest.fn(),
  };
  const redis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn(),
  };
  const refundNotificationPublisher = { publish: jest.fn() };

  const service = new PaymentsService(
    paymentRepository as any,
    redis as any,
    refundNotificationPublisher as any,
  );

  return { service, paymentRepository, redis };
}

// ---------------------------------------------------------------------------

describe('Initiate Payment — PaymentsService.initiate()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is actually wired and firing. If this fails, every negative
    // assertion in this describe block is meaningless.
    it('canary — a valid InitiatePaymentDto passes the real ValidationPipe', async () => {
      await expect(
        runPipe({
          appointmentId: APPOINTMENT_ID,
          amount: AMOUNT,
          orderInfo: 'Payment for APT-20260801-TEST',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          appointmentId: APPOINTMENT_ID,
          amount: AMOUNT,
        }),
      );
    });

    it('UTCID02 — empty appointmentId is rejected as 422 UnprocessableEntity [DIVERGES: SPEC_WRONG — sheet asserts on a non-existent field `id` and expects 400]', async () => {
      const { error, status, body } = await capturePipeRejection({
        appointmentId: '',
        amount: AMOUNT,
      });

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(status).toBe(422);
      expect(body).toMatchObject({
        status: 422,
        errors: { appointmentId: expect.any(String) },
      });
      expect(body.errors?.appointmentId).toContain('should not be empty');
      // There is no `id` property on this DTO at all — the sheet's field name is wrong.
      expect(body.errors).not.toHaveProperty('id');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — patient initiates a payment for their own appointment and receives { paymentUrl, payment } [DIVERGES: SPEC_WRONG — sheet expects a KycVerificationEntity]', async () => {
      const { service, paymentRepository } = createService();

      const result = await service.initiate(
        {
          appointmentId: APPOINTMENT_ID,
          amount: AMOUNT,
          orderInfo: 'Payment for APT-20260801-TEST',
        } as InitiatePaymentDto,
        INFERRED_PATIENT_ACTOR,
        BEARER,
      );

      // Ownership was verified by re-using the caller's own bearer against clinical-emr,
      // not bypassed — this is the real patient path, not the staff short-circuit.
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/appointments/${APPOINTMENT_ID}`),
        expect.objectContaining({ headers: { Authorization: BEARER } }),
      );
      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: APPOINTMENT_ID,
          amount: AMOUNT,
          status: 'pending',
          provider: 'vnpay',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          paymentUrl: expect.any(String),
          payment: expect.objectContaining({
            payment_id: PAYMENT_ID,
            appointment_id: APPOINTMENT_ID,
          }),
        }),
      );
      // Real return shape — nothing resembling the KycVerificationEntity the sheet expects.
      expect(result).not.toHaveProperty('kyc_id');
    });
  });
});
