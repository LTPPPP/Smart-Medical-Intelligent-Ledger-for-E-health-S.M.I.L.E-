// GENERATED from Report5_Unit Test.xlsx — sheet "Cancel Appointment" — 6 cases. Do not hand-edit.
//
// Target : AppointmentsService.cancel() — src/appointments/appointments.service.ts:766
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 1 DTO-validation case (UTCID03) / 5 service-behaviour cases (UTCID01,02,04,05,06)
// Spec   : 0 of 6 MATCHES, 6 of 6 DIVERGES — a 100%-divergence sheet.
//          Every divergence is recorded in docs/audit/uc-divergences.md (D2.1-D2.3).
//          Assertions below follow the CODE. The sheet is never bent to fit, and the code is
//          never bent to fit the sheet.
//
// Why this sheet diverges completely, in one line each:
//   UTCID01 SPEC_STALE — a patient "cancel" is a REQUEST; status stays `scheduled`.
//   UTCID03 SPEC_WRONG — right field and message, but this service answers 422, not 400.
//   UTCID02/04/05/06 SPEC_WRONG — assert DTO validation on `id`, `actorUserId`, `actorRole`,
//          none of which are properties of CancelAppointmentDto.

import {
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';

import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
// The service's OWN options object — imported, never re-declared. If validation-options.ts
// changes (status code, exceptionFactory, whitelist), these tests must move with it rather
// than silently drift. Hardcoding 422 here would defeat that.
import validationOptions from '../utils/validation-options';
// Distinct id per entity kind, guarded against collision at import time (defect T1).
import { UC_IDS, UC_MALFORMED_ID } from '../test-support/uc-fixtures';

const validationPipe = new ValidationPipe(validationOptions);

function runPipe(payload: Record<string, unknown>) {
  return validationPipe.transform(payload, {
    type: 'body',
    metatype: CancelAppointmentDto,
    data: '',
  });
}

/**
 * Invokes the method under test EXACTLY ONCE and returns whatever it threw (defect T3).
 * Asserting exception type and message from two separate calls would exercise the code twice
 * and could mask order-dependent behaviour.
 */
async function captureRejection(run: () => Promise<unknown>): Promise<unknown> {
  let caught: unknown;
  let resolved = false;
  try {
    await run();
    resolved = true;
  } catch (error) {
    caught = error;
  }
  if (resolved) {
    throw new Error('expected the call to reject, but it resolved');
  }
  return caught;
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
    body: httpError.getResponse() as {
      status?: number;
      errors?: Record<string, string>;
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Defect T1: these were previously two names for ONE literal (appointment id === actor id),
// which meant any assertion that only held because those two happened to be equal was a false
// pass. Now sourced from the collision-guarded registry, so every entity is distinct.
const APPOINTMENT_ID = UC_IDS.appointment;
const ACTOR_USER_ID = UC_IDS.actorUser;
const PATIENT_ID = UC_IDS.patient;
const DOCTOR_ID = UC_IDS.doctor;
const OTHER_PATIENT_ID = UC_IDS.otherPatient;

// --- Inferred mock state (rule D: every inference named and sourced) ---

// INFERRED from the sheet's Precondition column, which reads "Patient is already logged in;
// the target record already exists" on all 6 cases. Only one reading is defensible: the actor
// is a PATIENT, i.e. NOT one of ADMIN/RECEPTIONIST/NURSE/MANAGER, so cancel() takes the
// non-privileged branch at appointments.service.ts:787.
const INFERRED_ACTOR_ROLE = 'PATIENT';

// INFERRED from the same Precondition ("the target record already exists") plus UTCID01's
// expected "success": the appointment must be in a state a patient may still cancel. SCHEDULED
// is the only status the sheet's happy path is consistent with.
const INFERRED_APPOINTMENT_STATUS = AppointmentStatus.SCHEDULED;

function createAppointment(overrides: Record<string, unknown> = {}) {
  return {
    appointment_id: APPOINTMENT_ID,
    appointment_code: 'APT-20260801-TEST',
    patient_id: PATIENT_ID,
    doctor_id: DOCTOR_ID,
    status: INFERRED_APPOINTMENT_STATUS,
    cancellation_requested: false,
    cancellation_reason: null,
    cancelled_by: null,
    ...overrides,
  };
}

/**
 * AppointmentsService takes 16 constructor dependencies. Only those reachable from cancel()
 * are given behaviour; the rest are inert stubs so construction succeeds.
 */
function createService(
  options: { appointment?: unknown; actorPatientId?: string | null } = {},
) {
  const appointment =
    options.appointment === undefined
      ? createAppointment()
      : options.appointment;

  const appointmentRepository = {
    findOne: jest.fn().mockResolvedValue(appointment),
    save: jest.fn((value) => Promise.resolve(value)),
    create: jest.fn((value) => ({ ...value })),
  };
  const historyRepository = {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const patientsService = {
    // Drives resolveActorPatientId() — appointments.service.ts:110-118.
    findByUserId: jest
      .fn()
      .mockResolvedValue(
        options.actorPatientId === null
          ? null
          : { patient_id: options.actorPatientId ?? PATIENT_ID },
      ),
    blockBooking: jest.fn().mockResolvedValue(undefined),
  };
  const inertRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const service = new AppointmentsService(
    appointmentRepository as any,
    historyRepository as any,
    inertRepository as any, // doctorSpecialtyRepository
    inertRepository as any, // doctorScheduleRepository
    { publish: jest.fn() } as any, // notificationPublisher
    { check: jest.fn() } as any, // kycEligibilityClient
    patientsService as any,
    inertRepository as any, // serviceRepository
    inertRepository as any, // treatmentRoomRepository
    inertRepository as any, // clinicRepository
    inertRepository as any, // examinationSessionsRepository
    inertRepository as any, // treatmentPlansRepository
    { issue: jest.fn(), verify: jest.fn() } as any, // optionTokens
    inertRepository as any, // reminderPreferencesRepository
    inertRepository as any, // notificationLogsRepository
  );

  return { service, appointmentRepository, historyRepository, patientsService };
}

// ---------------------------------------------------------------------------

describe('Cancel Appointment — AppointmentsService.cancel()', () => {
  describe('DTO validation (ValidationPipe)', () => {
    // Canary: proves the pipe is actually wired and firing. If this fails, every negative
    // assertion in this describe block is meaningless.
    it('canary — a valid CancelAppointmentDto passes the real ValidationPipe', async () => {
      await expect(
        runPipe({
          cancelled_by: ACTOR_USER_ID,
          cancellation_reason: 'Routine check-up',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          cancelled_by: ACTOR_USER_ID,
          cancellation_reason: 'Routine check-up',
        }),
      );
    });

    it('UTCID03 — empty cancelled_by is rejected as 422 UnprocessableEntity [DIVERGES: SPEC_WRONG — sheet says BadRequestException/400]', async () => {
      const { error, status, body } = await capturePipeRejection({
        cancelled_by: '',
        cancellation_reason: 'Routine check-up',
      });

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(status).toBe(422);
      expect(body).toMatchObject({
        status: 422,
        errors: { cancelled_by: expect.any(String) },
      });
      // The sheet's message text IS correct here; only the exception type is wrong.
      expect(body.errors?.cancelled_by).toContain('should not be empty');
    });
  });

  describe('service behaviour', () => {
    it('UTCID01 — patient cancel records a REQUEST and leaves status scheduled [DIVERGES: SPEC_STALE — sheet implies the record becomes cancelled]', async () => {
      const {
        service,
        appointmentRepository,
        historyRepository,
        patientsService,
      } = createService();

      const result = await service.cancel(
        APPOINTMENT_ID,
        {
          cancelled_by: ACTOR_USER_ID,
          cancellation_reason: 'Routine check-up',
        } as CancelAppointmentDto,
        ACTOR_USER_ID,
        INFERRED_ACTOR_ROLE,
      );

      // Real two-step behaviour (appointments.service.ts:787-803) — confirmed live against
      // the running stack: a patient-side UI cancel returned 200 and left the DB row at
      // status=scheduled, cancellation_requested=t.
      expect(result).toEqual(
        expect.objectContaining({
          cancellation_requested: true,
          cancellation_reason: 'Routine check-up',
          cancelled_by: ACTOR_USER_ID,
          status: AppointmentStatus.SCHEDULED,
        }),
      );
      expect(result.status).not.toBe(AppointmentStatus.CANCELLED);
      expect(appointmentRepository.save).toHaveBeenCalledTimes(1);
      // History row records an UNCHANGED status on both sides.
      expect(historyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: APPOINTMENT_ID,
          old_status: AppointmentStatus.SCHEDULED,
          new_status: AppointmentStatus.SCHEDULED,
        }),
      );
      // Future-booking block belongs to the staff confirmation step, not to a request.
      expect(patientsService.blockBooking).not.toHaveBeenCalled();
    });

    // Defect T2: this was titled "empty id throws NotFoundException", which the assertion does
    // NOT establish — the repository stub returns null for ANY id, so the same rejection would
    // occur with a well-formed id. What is actually proven is the lookup-miss path. The empty
    // string is passed to mirror the sheet's input, but it is not what causes the throw.
    it('UTCID02 — a lookup miss (repository returns null) throws NotFoundException; the empty id is incidental, not causal [DIVERGES: SPEC_WRONG — `id` is a route param, not a DTO field, so "id should not be empty" cannot occur]', async () => {
      const { service, appointmentRepository } = createService({
        appointment: null,
      });

      await expect(
        service.cancel(
          '',
          { cancelled_by: ACTOR_USER_ID } as CancelAppointmentDto,
          ACTOR_USER_ID,
          INFERRED_ACTOR_ROLE,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      // Documents the real cause: the id reached the repository and simply matched nothing.
      expect(appointmentRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { appointment_id: '' } }),
      );
    });

    it('UTCID04 — empty actorUserId is rejected by the ownership guard [DIVERGES: SPEC_WRONG — actorUserId is a method argument, never DTO-validated]', async () => {
      // '' is not nullish, so `actorUserId ?? dto.cancelled_by` keeps '' (service.ts:774,782).
      // resolveActorPatientId('') short-circuits to null on the falsy guard at service.ts:113
      // WITHOUT querying patients; PATIENT is neither DOCTOR nor privileged staff, so the
      // third ownership guard rejects (service.ts:349-357).
      const { service, patientsService } = createService({
        actorPatientId: null,
      });

      await expect(
        service.cancel(
          APPOINTMENT_ID,
          { cancelled_by: ACTOR_USER_ID } as CancelAppointmentDto,
          '',
          INFERRED_ACTOR_ROLE,
        ),
      ).rejects.toThrow(
        'A trusted patient, doctor, or staff role is required for appointment records.',
      );
      expect(patientsService.findByUserId).not.toHaveBeenCalled();
    });

    it('UTCID05 — actorUserId resolving to a different patient throws ForbiddenException [DIVERGES: SPEC_WRONG — there is no uuid check on actorUserId; ownership is what guards this]', async () => {
      const { service } = createService({ actorPatientId: OTHER_PATIENT_ID });

      // Defect T3: invoked ONCE; type and message are asserted from the single rejection.
      const rejection = await captureRejection(() =>
        service.cancel(
          APPOINTMENT_ID,
          { cancelled_by: ACTOR_USER_ID } as CancelAppointmentDto,
          UC_MALFORMED_ID,
          INFERRED_ACTOR_ROLE,
        ),
      );

      expect(rejection).toBeInstanceOf(ForbiddenException);
      expect((rejection as ForbiddenException).message).toBe(
        'The authenticated user can only modify their own appointment records.',
      );
    });

    it('UTCID06 — empty actorRole is treated as non-privileged and still records a request [DIVERGES: SPEC_WRONG — actorRole is an optional argument, never DTO-validated]', async () => {
      const { service, patientsService } = createService();

      const result = await service.cancel(
        APPOINTMENT_ID,
        { cancelled_by: ACTOR_USER_ID } as CancelAppointmentDto,
        ACTOR_USER_ID,
        '',
      );

      expect(result).toEqual(
        expect.objectContaining({
          cancellation_requested: true,
          status: AppointmentStatus.SCHEDULED,
        }),
      );
      expect(patientsService.blockBooking).not.toHaveBeenCalled();
    });
  });
});
