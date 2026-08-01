// Shared service factories for GENERATED *.uc.spec.ts files (clinical-emr-service).
//
// Why this file exists (throughput): clinical-emr's 62 workbook sheets collapse to 18 target
// classes, and `AppointmentsService` alone accounts for 11 sheets / 100 UTCIDs. Hand-building
// its 15-dependency constructor once per sheet is both slow to generate and easy to get subtly
// wrong. Each target class that appears in more than one sheet gets exactly one factory here.
//
// Convention (unchanged from the repo's existing style): dependencies are hand-rolled
// `jest.fn()` mocks cast `as any` and passed positionally to the real constructor. No
// `Test.createTestingModule` — see medical-history.service.spec.ts for the original pattern.
//
// Every factory returns the constructed service ALONGSIDE its mocks, so a generated test can
// assert on interactions (`expect(mocks.patientsService.blockBooking).not.toHaveBeenCalled()`)
// without reaching back into module internals.

import { AppointmentsService } from '../appointments/appointments.service';

/** A TypeORM repository mock with the methods the services actually reach for. */
export function createRepositoryMock(overrides: Record<string, unknown> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn((value: unknown) => (Array.isArray(value) ? [...value] : { ...(value as object) })),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn((value: unknown) => Promise.resolve(value)),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(),
    manager: { transaction: jest.fn(async (cb: (m: unknown) => unknown) => cb({})) },
    ...overrides,
  };
}

export interface AppointmentsServiceMocks {
  appointmentRepository: ReturnType<typeof createRepositoryMock>;
  historyRepository: ReturnType<typeof createRepositoryMock>;
  doctorSpecialtyRepository: ReturnType<typeof createRepositoryMock>;
  doctorScheduleRepository: ReturnType<typeof createRepositoryMock>;
  notificationPublisher: Record<string, jest.Mock>;
  kycEligibilityClient: Record<string, jest.Mock>;
  patientsService: Record<string, jest.Mock>;
  serviceRepository: ReturnType<typeof createRepositoryMock>;
  treatmentRoomRepository: ReturnType<typeof createRepositoryMock>;
  clinicRepository: ReturnType<typeof createRepositoryMock>;
  examinationSessionsRepository: ReturnType<typeof createRepositoryMock>;
  treatmentPlansRepository: ReturnType<typeof createRepositoryMock>;
  optionTokens: Record<string, jest.Mock>;
  reminderPreferencesRepository: ReturnType<typeof createRepositoryMock>;
  notificationLogsRepository: ReturnType<typeof createRepositoryMock>;
}

/**
 * Construct a real `AppointmentsService` over inert mocks.
 *
 * Positional order mirrors the constructor at
 * `src/appointments/appointments.service.ts` exactly (15 dependencies). Pass `overrides` to
 * give any single dependency behaviour for the case under test; everything else stays inert so
 * an unexpected call surfaces as a clean "not configured" failure rather than a silent pass.
 */
export function createAppointmentsService(
  overrides: Partial<AppointmentsServiceMocks> = {},
): { service: AppointmentsService; mocks: AppointmentsServiceMocks } {
  const mocks: AppointmentsServiceMocks = {
    appointmentRepository: createRepositoryMock(),
    historyRepository: createRepositoryMock(),
    doctorSpecialtyRepository: createRepositoryMock(),
    doctorScheduleRepository: createRepositoryMock(),
    notificationPublisher: {
      publishCreated: jest.fn().mockResolvedValue(undefined),
      publishUpdated: jest.fn().mockResolvedValue(undefined),
      publishCancelled: jest.fn().mockResolvedValue(undefined),
      publishConfirmation: jest.fn().mockResolvedValue(undefined),
      publishReminder: jest.fn().mockResolvedValue(undefined),
    },
    kycEligibilityClient: { assertEligible: jest.fn().mockResolvedValue(undefined) },
    patientsService: {
      findByUserId: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      blockBooking: jest.fn().mockResolvedValue(undefined),
      clearBooking: jest.fn().mockResolvedValue(undefined),
    },
    serviceRepository: createRepositoryMock(),
    treatmentRoomRepository: createRepositoryMock(),
    clinicRepository: createRepositoryMock(),
    examinationSessionsRepository: createRepositoryMock(),
    treatmentPlansRepository: createRepositoryMock(),
    optionTokens: { issue: jest.fn(), verify: jest.fn() },
    reminderPreferencesRepository: createRepositoryMock(),
    notificationLogsRepository: createRepositoryMock(),
    ...overrides,
  };

  const service = new AppointmentsService(
    mocks.appointmentRepository as any,
    mocks.historyRepository as any,
    mocks.doctorSpecialtyRepository as any,
    mocks.doctorScheduleRepository as any,
    mocks.notificationPublisher as any,
    mocks.kycEligibilityClient as any,
    mocks.patientsService as any,
    mocks.serviceRepository as any,
    mocks.treatmentRoomRepository as any,
    mocks.clinicRepository as any,
    mocks.examinationSessionsRepository as any,
    mocks.treatmentPlansRepository as any,
    mocks.optionTokens as any,
    mocks.reminderPreferencesRepository as any,
    mocks.notificationLogsRepository as any,
  );

  return { service, mocks };
}
