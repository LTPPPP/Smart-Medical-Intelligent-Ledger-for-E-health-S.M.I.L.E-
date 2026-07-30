import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import { AppointmentType } from '../utils/enums/appointment-type.enum';
import { PaymentStatus } from '../utils/enums/payment-status.enum';

const appointmentId = 'a0000000-0000-0000-0000-000000000001';
const patientId = 'p0000000-0000-0000-0000-000000000001';
const doctorId = 'd0000000-0000-0000-0000-000000000001';
const clinicId = 'c0000000-0000-0000-0000-000000000001';
const roomId = 'r0000000-0000-0000-0000-000000000001';
const serviceId = 's0000000-0000-0000-0000-000000000001';
const specialtyId = 'sp000000-0000-0000-0000-000000000001';
const actorId = 'u0000000-0000-0000-0000-000000000001';
const patientUserId = 'u0000000-0000-0000-0000-000000000011';
const sessionId = 'e0000000-0000-0000-0000-000000000001';
const treatmentPlanId = 'f0000000-0000-0000-0000-000000000001';

function createRepositoryMock() {
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn((value) =>
      Promise.resolve({
        ...value,
        appointment_id: value.appointment_id ?? appointmentId,
      }),
    ),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    manager: {
      create: jest.fn((entity, value) => value),
      save: jest.fn((value) =>
        Promise.resolve({
          ...value,
          appointment_id: value.appointment_id ?? appointmentId,
        }),
      ),
      transaction: jest.fn((callback) => callback(repository.manager)),
    },
  };

  return repository;
}

function createService() {
  const appointmentRepository = createRepositoryMock();
  const historyRepository = createRepositoryMock();
  const doctorSpecialtyRepository = createRepositoryMock();
  const doctorScheduleRepository = createRepositoryMock();
  const serviceRepository = createRepositoryMock();
  const examinationSessionsRepository = createRepositoryMock();
  const treatmentPlansRepository = createRepositoryMock();
  const reminderPreferencesRepository = createRepositoryMock();
  const notificationLogsRepository = createRepositoryMock();
  const optionTokens = {
    verify: jest.fn(),
  };
  const notificationPublisher = {
    sendAppointmentConfirmation: jest.fn(),
    sendAppointmentReminder: jest.fn(),
  };
  const kycEligibilityClient = {
    assertCanBook: jest.fn(() => Promise.resolve(undefined)),
  };
  const patientsService = {
    findByUserId: jest.fn<Promise<any>, [string]>(() => Promise.resolve(null)),
    findOne: jest.fn<Promise<any>, [string]>(() =>
      Promise.resolve({ patient_id: patientId, user_id: patientUserId }),
    ),
  };
  doctorSpecialtyRepository.findOne.mockResolvedValue({ doctor_id: doctorId });

  const service = new AppointmentsService(
    appointmentRepository as any,
    historyRepository as any,
    doctorSpecialtyRepository as any,
    doctorScheduleRepository as any,
    notificationPublisher as any,
    kycEligibilityClient as any,
    patientsService as any,
    serviceRepository as any,
    examinationSessionsRepository as any,
    treatmentPlansRepository as any,
    optionTokens as any,
    reminderPreferencesRepository as any,
    notificationLogsRepository as any,
  );

  return {
    service,
    appointmentRepository,
    historyRepository,
    doctorSpecialtyRepository,
    doctorScheduleRepository,
    serviceRepository,
    examinationSessionsRepository,
    treatmentPlansRepository,
    reminderPreferencesRepository,
    notificationLogsRepository,
    optionTokens,
    notificationPublisher,
    kycEligibilityClient,
    patientsService,
  };
}

function mockAuthenticatedPatient(patientsService: {
  findByUserId: jest.Mock;
}) {
  patientsService.findByUserId.mockResolvedValue({
    patient_id: patientId,
    user_id: actorId,
  });
}

describe('AppointmentsService', () => {
  it('should let a patient create an appointment without a KYC check', async () => {
    const {
      service,
      appointmentRepository,
      kycEligibilityClient,
      patientsService,
    } = createService();
    mockAuthenticatedPatient(patientsService);
    kycEligibilityClient.assertCanBook.mockRejectedValue(
      new BadRequestException('KYC_REQUIRED'),
    );

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
        'PATIENT',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        patient_id: patientId,
        created_by: actorId,
      }),
    );

    expect(kycEligibilityClient.assertCanBook).not.toHaveBeenCalled();
    expect(appointmentRepository.manager.transaction).toHaveBeenCalled();
  });

  it('should reject booking for another authenticated patient', async () => {
    const { service, patientsService, appointmentRepository } = createService();
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
        'PATIENT',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should reject appointment creation when the requested patient record does not exist', async () => {
    const {
      service,
      patientsService,
      appointmentRepository,
      kycEligibilityClient,
    } = createService();
    patientsService.findOne.mockRejectedValue(
      new NotFoundException(`Patient with ID ${patientId} not found`),
    );

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(patientsService.findOne).toHaveBeenCalledWith(patientId);
    expect(kycEligibilityClient.assertCanBook).not.toHaveBeenCalled();
    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should reject appointment creation when the requested doctor has no Clinical projection', async () => {
    const {
      service,
      appointmentRepository,
      doctorScheduleRepository,
      doctorSpecialtyRepository,
      kycEligibilityClient,
      patientsService,
    } = createService();
    mockAuthenticatedPatient(patientsService);
    doctorScheduleRepository.findOne.mockResolvedValue(null);
    doctorSpecialtyRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
        'PATIENT',
      ),
    ).rejects.toThrow('DOCTOR_RECORD_NOT_FOUND');

    expect(doctorScheduleRepository.findOne).toHaveBeenCalledWith({
      where: { doctor_id: doctorId },
    });
    expect(doctorSpecialtyRepository.findOne).toHaveBeenCalledWith({
      where: { doctor_id: doctorId },
    });
    expect(kycEligibilityClient.assertCanBook).not.toHaveBeenCalled();
    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should reject appointment creation when actor has no patient projection or trusted role', async () => {
    const {
      service,
      appointmentRepository,
      kycEligibilityClient,
      patientsService,
    } = createService();

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(patientsService.findOne).not.toHaveBeenCalled();
    expect(kycEligibilityClient.assertCanBook).not.toHaveBeenCalled();
    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should let trusted staff create for a patient projection and check KYC against the staff user', async () => {
    const {
      service,
      appointmentRepository,
      kycEligibilityClient,
      patientsService,
    } = createService();
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000099',
      user_id: actorId,
    });

    await service.create(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-01',
        appointment_time: '09:00',
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(patientsService.findByUserId).not.toHaveBeenCalled();
    expect(kycEligibilityClient.assertCanBook).toHaveBeenCalledWith(actorId);
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        patient_id: patientId,
        created_by: actorId,
      }),
    );
  });

  it('should reject cancellation of another patient appointment', async () => {
    const { service, patientsService, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      status: AppointmentStatus.SCHEDULED,
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.cancel(
        appointmentId,
        { cancelled_by: actorId, cancellation_reason: 'Changed plans' },
        actorId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should reject cancellation of another doctor appointment by an authenticated doctor', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: AppointmentStatus.SCHEDULED,
    });

    await expect(
      service.cancel(
        appointmentId,
        { cancelled_by: actorId, cancellation_reason: 'Doctor unavailable' },
        'd0000000-0000-0000-0000-000000000002',
        'DOCTOR',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should allow receptionist cancellation after patient projection is not present', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: AppointmentStatus.SCHEDULED,
    });

    await service.cancel(
      appointmentId,
      { cancelled_by: actorId, cancellation_reason: 'Clinic request' },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AppointmentStatus.CANCELLED,
        cancelled_by: actorId,
      }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        new_status: AppointmentStatus.CANCELLED,
        changed_by: actorId,
      }),
    );
  });

  it('should create an appointment with a scheduled status history entry', async () => {
    const {
      service,
      appointmentRepository,
      historyRepository,
      patientsService,
    } = createService();
    mockAuthenticatedPatient(patientsService);

    const result = await service.create(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_date: '2026-06-01',
        appointment_time: '09:00',
        duration_minutes: 45,
        created_by: actorId,
      },
      actorId,
      'PATIENT',
    );

    expect(result.appointment_id).toBe(appointmentId);
    expect(appointmentRepository.manager.transaction).toHaveBeenCalled();
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_code: expect.stringMatching(/^APT-\d{8}-[A-Z0-9]{4}$/),
        appointment_date: new Date('2026-06-01'),
      }),
    );
    expect(appointmentRepository.manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        old_status: null,
        new_status: AppointmentStatus.SCHEDULED,
        changed_by: actorId,
        reason: 'Appointment created',
      }),
    );
    expect(historyRepository.save).not.toHaveBeenCalled();
  });

  it('should reject linked follow-up appointments before finalize or treatment plan acceptance', async () => {
    const {
      service,
      appointmentRepository,
      examinationSessionsRepository,
      treatmentPlansRepository,
    } = createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'in_progress',
      signed_at: null,
    });
    treatmentPlansRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-15',
          appointment_time: '09:00',
          appointment_type: AppointmentType.FOLLOW_UP,
          session_id: sessionId,
          created_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(ConflictException);

    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should create a recall appointment linked to a finalized encounter', async () => {
    const { service, appointmentRepository, examinationSessionsRepository } =
      createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'completed',
      signed_at: new Date(),
    });

    await service.create(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-15',
        appointment_time: '09:00',
        appointment_type: AppointmentType.FOLLOW_UP,
        session_id: sessionId,
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        appointment_type: AppointmentType.FOLLOW_UP,
        session_id: sessionId,
      }),
    );
  });

  it('should create a treatment-plan follow-up after patient acceptance', async () => {
    const {
      service,
      appointmentRepository,
      examinationSessionsRepository,
      treatmentPlansRepository,
    } = createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'in_progress',
      signed_at: null,
    });
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: treatmentPlanId,
      session_id: sessionId,
      patient_id: patientId,
      status: 'accepted',
    });

    await service.create(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-15',
        appointment_time: '09:00',
        appointment_type: AppointmentType.FOLLOW_UP,
        session_id: sessionId,
        treatment_plan_id: treatmentPlanId,
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        appointment_type: AppointmentType.FOLLOW_UP,
        session_id: sessionId,
        treatment_plan_id: treatmentPlanId,
      }),
    );
  });

  it('should map database double-booking conflicts to conflict errors', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.manager.transaction.mockImplementationOnce(
      (callback) =>
        callback({
          create: jest.fn((entity, value) => value),
          save: jest
            .fn()
            .mockRejectedValueOnce({ driverError: { code: '23P01' } }),
        }),
    );

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          created_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should book by specialty using the first scheduled doctor at the clinic', async () => {
    const {
      service,
      appointmentRepository,
      doctorSpecialtyRepository,
      doctorScheduleRepository,
    } = createService();
    doctorSpecialtyRepository.find.mockResolvedValue([{ doctor_id: doctorId }]);
    doctorScheduleRepository.findOne.mockResolvedValue({ doctor_id: doctorId });

    await service.createBySpecialty(
      {
        specialty_id: specialtyId,
        patient_id: patientId,
        clinic_id: clinicId,
        preferred_date: '2026-06-01',
        preferred_time: '10:30',
        duration_minutes: 30,
        chief_complaint: 'Tooth pain',
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(doctorScheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        doctor_id: doctorId,
        clinic_id: clinicId,
        work_date: new Date('2026-06-01'),
        status: 'scheduled',
      },
    });
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        doctor_id: doctorId,
        appointment_date: new Date('2026-06-01'),
        appointment_time: '10:30',
      }),
    );
  });

  it('should reject booking by specialty when no doctors match the specialty', async () => {
    const { service, doctorSpecialtyRepository } = createService();
    doctorSpecialtyRepository.find.mockResolvedValue([]);

    await expect(
      service.createBySpecialty({
        specialty_id: specialtyId,
        patient_id: patientId,
        clinic_id: clinicId,
        created_by: actorId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject booking by specialty when matching doctors have no scheduled availability', async () => {
    const { service, doctorSpecialtyRepository, doctorScheduleRepository } =
      createService();
    doctorSpecialtyRepository.find.mockResolvedValue([{ doctor_id: doctorId }]);
    doctorScheduleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createBySpecialty({
        specialty_id: specialtyId,
        patient_id: patientId,
        clinic_id: clinicId,
        preferred_date: '2026-06-01',
        created_by: actorId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject booking by doctor when the doctor has no scheduled availability', async () => {
    const { service, doctorScheduleRepository } = createService();
    doctorScheduleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createByDoctor({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-01',
        appointment_time: '11:00',
        created_by: actorId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should book by doctor using service duration and compatible scheduled room', async () => {
    const {
      service,
      appointmentRepository,
      doctorScheduleRepository,
      serviceRepository,
    } = createService();
    serviceRepository.findOne.mockResolvedValue({
      service_id: serviceId,
      duration_minutes: 45,
      required_room_type: 'examination',
    });
    doctorScheduleRepository.findOne.mockResolvedValue({
      doctor_id: doctorId,
      room_id: roomId,
      room: { room_id: roomId, room_type: 'examination' },
    });

    await service.createByDoctor(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_date: '2026-06-01',
        appointment_time: '11:00',
        appointment_type: AppointmentType.CONSULTATION,
        duration_minutes: 999,
        chief_complaint: 'Jaw pain',
        notes: 'Prefers morning',
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(doctorScheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        doctor_id: doctorId,
        clinic_id: clinicId,
        work_date: new Date('2026-06-01'),
        status: 'scheduled',
      },
      relations: ['room', 'shift'],
    });
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        duration_minutes: 45,
        appointment_type: AppointmentType.CONSULTATION,
        chief_complaint: 'Jaw pain',
        notes: 'Prefers morning',
      }),
    );
  });

  it('should book an appointment from a verified availability option token', async () => {
    const {
      service,
      appointmentRepository,
      doctorScheduleRepository,
      serviceRepository,
      optionTokens,
    } = createService();
    optionTokens.verify.mockReturnValue({
      patient_id: patientId,
      service_id: serviceId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      room_id: roomId,
      work_date: '2026-06-01',
      start_time: '11:00',
    });
    serviceRepository.findOne.mockResolvedValue({
      service_id: serviceId,
      duration_minutes: 45,
      required_room_type: 'examination',
    });
    doctorScheduleRepository.findOne.mockResolvedValue({
      doctor_id: doctorId,
      room_id: roomId,
      room: { room_id: roomId, room_type: 'examination' },
    });

    await service.createByOption(
      {
        patient_id: patientId,
        option_token: 'opaque-slot-token',
        appointment_type: AppointmentType.CONSULTATION,
        chief_complaint: 'Jaw pain',
        notes: 'Prefers morning',
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(optionTokens.verify).toHaveBeenCalledWith('opaque-slot-token');
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_date: new Date('2026-06-01'),
        appointment_time: '11:00',
        duration_minutes: 45,
        appointment_type: AppointmentType.CONSULTATION,
        chief_complaint: 'Jaw pain',
        notes: 'Prefers morning',
      }),
    );
  });

  it('should reschedule an appointment from a verified availability option token', async () => {
    const {
      service,
      appointmentRepository,
      doctorScheduleRepository,
      serviceRepository,
      optionTokens,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      status: AppointmentStatus.SCHEDULED,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    optionTokens.verify.mockReturnValue({
      patient_id: patientId,
      service_id: serviceId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      room_id: roomId,
      work_date: '2026-06-02',
      start_time: '13:30',
    });
    serviceRepository.findOne.mockResolvedValue({
      service_id: serviceId,
      duration_minutes: 45,
      required_room_type: 'examination',
    });
    doctorScheduleRepository.findOne.mockResolvedValue({
      doctor_id: doctorId,
      room_id: roomId,
      room: { room_id: roomId, room_type: 'examination' },
    });

    await service.rescheduleByOption(
      appointmentId,
      {
        option_token: 'opaque-slot-token',
        notes: 'Move to afternoon',
        updated_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(optionTokens.verify).toHaveBeenCalledWith('opaque-slot-token');
    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_date: new Date('2026-06-02'),
        appointment_time: '13:30',
        duration_minutes: 45,
        notes: 'Move to afternoon',
      }),
    );
  });

  it('should reject booking by doctor when the scheduled room does not match the service', async () => {
    const { service, doctorScheduleRepository, serviceRepository } =
      createService();
    serviceRepository.findOne.mockResolvedValue({
      service_id: serviceId,
      duration_minutes: 45,
      required_room_type: 'surgery',
    });
    doctorScheduleRepository.findOne.mockResolvedValue({
      doctor_id: doctorId,
      room_id: roomId,
      room: { room_id: roomId, room_type: 'examination' },
    });

    await expect(
      service.createByDoctor({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_date: '2026-06-01',
        appointment_time: '11:00',
        created_by: actorId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should try the next specialty doctor when the first doctor has no schedule', async () => {
    const {
      service,
      appointmentRepository,
      doctorSpecialtyRepository,
      doctorScheduleRepository,
    } = createService();
    const secondDoctorId = 'd0000000-0000-0000-0000-000000000002';
    doctorSpecialtyRepository.find.mockResolvedValue([
      { doctor_id: doctorId },
      { doctor_id: secondDoctorId },
    ]);
    doctorScheduleRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ doctor_id: secondDoctorId });

    await service.createBySpecialty(
      {
        specialty_id: specialtyId,
        patient_id: patientId,
        clinic_id: clinicId,
        preferred_date: '2026-06-01',
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(doctorScheduleRepository.findOne).toHaveBeenNthCalledWith(1, {
      where: {
        doctor_id: doctorId,
        clinic_id: clinicId,
        work_date: new Date('2026-06-01'),
        status: 'scheduled',
      },
    });
    expect(doctorScheduleRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: {
        doctor_id: secondDoctorId,
        clinic_id: clinicId,
        work_date: new Date('2026-06-01'),
        status: 'scheduled',
      },
    });
    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        doctor_id: secondDoctorId,
        appointment_time: '09:00',
      }),
    );
  });

  it('should mark outside-hours appointments with reason and approver', async () => {
    const { service, appointmentRepository } = createService();

    await service.createOutsideHours(
      {
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-01',
        appointment_time: '20:30',
        outside_hours_reason: 'Emergency pain',
        approved_by: actorId,
        created_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        is_outside_hours: true,
        outside_hours_reason: 'Emergency pain',
        approved_by: actorId,
      }),
    );
  });

  it('should update non-scheduling appointment metadata', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.IN_PROGRESS,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });

    await service.update(
      appointmentId,
      {
        appointment_type: AppointmentType.FOLLOW_UP,
        notes: 'Updated by receptionist',
        payment_status: PaymentStatus.PAID,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_date: new Date('2026-06-01'),
        appointment_time: '09:00',
        appointment_type: AppointmentType.FOLLOW_UP,
        notes: 'Updated by receptionist',
        payment_status: PaymentStatus.PAID,
      }),
    );
  });

  it('should reject generic updates that attempt to change scheduling fields', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      status: AppointmentStatus.SCHEDULED,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
      doctor_id: doctorId,
      room_id: roomId,
      service_id: serviceId,
      duration_minutes: 30,
    });

    await expect(
      service.update(
        appointmentId,
        {
          appointment_date: '2026-06-02',
          appointment_time: '13:30',
          room_id: 'r0000000-0000-0000-0000-000000000002',
          service_id: 's0000000-0000-0000-0000-000000000002',
          duration_minutes: 60,
          notes: 'Move to afternoon',
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should list appointments with pagination, filters, and date range', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    appointmentRepository.findAndCount.mockResolvedValue([
      [{ appointment_id: appointmentId }],
      1,
    ]);

    const result = await service.findAll(
      {
        page: 3,
        limit: 5,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        status: AppointmentStatus.CONFIRMED,
        appointment_type: AppointmentType.CONSULTATION,
        session_id: sessionId,
        treatment_plan_id: treatmentPlanId,
        payment_status: PaymentStatus.PAID,
        is_outside_hours: false,
        date_from: '2026-06-01',
        date_to: '2026-06-30',
      },
      actorId,
    );

    expect(result).toEqual({
      data: [{ appointment_id: appointmentId }],
      total: 1,
    });
    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          status: AppointmentStatus.CONFIRMED,
          appointment_type: AppointmentType.CONSULTATION,
          session_id: sessionId,
          treatment_plan_id: treatmentPlanId,
          payment_status: PaymentStatus.PAID,
          is_outside_hours: false,
          appointment_date: expect.any(Object),
        }),
        relations: ['clinic', 'room', 'service'],
        skip: 10,
        take: 5,
        order: { appointment_date: 'ASC', appointment_time: 'ASC' },
      }),
    );
  });

  it('should prefer an exact appointment date filter over a date range', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(
      {
        patient_id: patientId,
        appointment_date: '2026-06-15',
        date_from: '2026-06-01',
        date_to: '2026-06-30',
      },
      actorId,
    );

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patient_id: patientId,
          appointment_date: new Date('2026-06-15'),
        }),
      }),
    );
  });

  it('should scope list queries to the authenticated patient projection', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll({ status: AppointmentStatus.SCHEDULED }, actorId);

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patient_id: patientId,
          status: AppointmentStatus.SCHEDULED,
        }),
      }),
    );
  });

  it('should reject list queries for a different patient than the authenticated projection', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });

    await expect(
      service.findAll(
        {
          patient_id: 'p0000000-0000-0000-0000-000000000002',
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.findAndCount).not.toHaveBeenCalled();
  });

  it('should scope list queries to the authenticated doctor projection', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(
      { status: AppointmentStatus.SCHEDULED },
      doctorId,
      'DOCTOR',
    );

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          doctor_id: doctorId,
          status: AppointmentStatus.SCHEDULED,
        }),
      }),
    );
  });

  it('should reject list queries for a different doctor than the authenticated projection', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findAll(
        {
          doctor_id: 'd0000000-0000-0000-0000-000000000002',
        },
        doctorId,
        'DOCTOR',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.findAndCount).not.toHaveBeenCalled();
  });

  it('should reject list queries when actor has no patient projection or trusted role', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findAll({ status: AppointmentStatus.SCHEDULED }, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.findAndCount).not.toHaveBeenCalled();
  });

  it('should allow receptionist list queries without patient projection', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(
      { status: AppointmentStatus.SCHEDULED },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: AppointmentStatus.SCHEDULED,
        }),
      }),
    );
  });

  it('should accept case-insensitive trusted staff roles', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(
      { status: AppointmentStatus.SCHEDULED },
      actorId,
      'receptionist',
    );

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: AppointmentStatus.SCHEDULED,
        }),
      }),
    );
  });

  it('should cancel an appointment and record cancellation history', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.SCHEDULED,
    });

    await service.cancel(
      appointmentId,
      {
        cancelled_by: actorId,
        cancellation_reason: 'Patient unavailable',
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AppointmentStatus.CANCELLED,
        cancelled_by: actorId,
        cancellation_reason: 'Patient unavailable',
        cancelled_at: expect.any(Date),
      }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        old_status: AppointmentStatus.SCHEDULED,
        new_status: AppointmentStatus.CANCELLED,
        changed_by: actorId,
        reason: 'Patient unavailable',
      }),
    );
  });

  it('should use a default cancellation history reason when none is provided', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.SCHEDULED,
    });

    await service.cancel(
      appointmentId,
      { cancelled_by: actorId },
      actorId,
      'RECEPTIONIST',
    );

    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Appointment cancelled',
      }),
    );
  });

  it('should confirm an appointment and record status history', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.SCHEDULED,
    });

    await service.confirm(appointmentId, actorId, 'RECEPTIONIST');

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AppointmentStatus.CONFIRMED }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        old_status: AppointmentStatus.SCHEDULED,
        new_status: AppointmentStatus.CONFIRMED,
        changed_by: actorId,
        reason: 'Appointment confirmed',
      }),
    );
  });

  it('should send a confirmation notification when an appointment is confirmed', async () => {
    const { service, appointmentRepository, notificationPublisher } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260703-AUTO',
      patient_id: patientId,
      status: AppointmentStatus.SCHEDULED,
      appointment_date: new Date('2026-07-03'),
      appointment_time: '09:00',
    });

    await service.confirm(appointmentId, actorId, 'RECEPTIONIST');

    expect(
      notificationPublisher.sendAppointmentConfirmation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        recipientId: patientUserId,
        notificationType: 'APPOINTMENT_CONFIRMATION',
        relatedEntityId: appointmentId,
        relatedEntityType: 'appointment',
      }),
    );
  });

  it('should not duplicate publisher failure logs when confirmation delivery fails', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const { service, appointmentRepository, notificationPublisher } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: 'a9999999-9999-9999-9999-999999999999',
      appointment_code: 'APT-SENTINEL',
      patient_id: patientId,
      status: AppointmentStatus.SCHEDULED,
      appointment_date: new Date('2026-07-03'),
      appointment_time: '09:00',
    });
    notificationPublisher.sendAppointmentConfirmation.mockRejectedValue(
      new Error('SENTINEL_RAW_CONFIRMATION_ERROR'),
    );
    await expect(
      service.confirm(
        'a9999999-9999-9999-9999-999999999999',
        actorId,
        'RECEPTIONIST',
      ),
    ).resolves.toEqual(
      expect.objectContaining({ status: AppointmentStatus.CONFIRMED }),
    );

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should change appointment status with a nullable history reason', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.IN_PROGRESS,
    });

    await service.changeStatus(
      appointmentId,
      {
        status: AppointmentStatus.COMPLETED,
        changed_by: actorId,
      },
      actorId,
      'RECEPTIONIST',
    );

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AppointmentStatus.COMPLETED }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        old_status: AppointmentStatus.IN_PROGRESS,
        new_status: AppointmentStatus.COMPLETED,
        changed_by: actorId,
        reason: null,
      }),
    );
  });

  it('should reject illegal appointment status transitions', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.COMPLETED,
    });

    await expect(
      service.changeStatus(
        appointmentId,
        {
          status: AppointmentStatus.CONFIRMED,
          changed_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(ConflictException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should reject cancellation from a terminal status', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.COMPLETED,
    });

    await expect(
      service.cancel(
        appointmentId,
        {
          cancelled_by: actorId,
          cancellation_reason: 'Too late',
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(ConflictException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should check in a scheduled appointment and record status history', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_date: new Date('2020-01-01'),
      status: AppointmentStatus.SCHEDULED,
    });

    await service.checkIn(appointmentId, actorId, 'RECEPTIONIST');

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AppointmentStatus.CHECKED_IN }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        old_status: AppointmentStatus.SCHEDULED,
        new_status: AppointmentStatus.CHECKED_IN,
        changed_by: actorId,
        reason: 'Patient checked in',
      }),
    );
  });

  it('should reject check-in for a future appointment', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_date: new Date('2999-01-01'),
      status: AppointmentStatus.SCHEDULED,
    });

    await expect(
      service.checkIn(appointmentId, actorId, 'RECEPTIONIST'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
    expect(historyRepository.save).not.toHaveBeenCalled();
  });

  it('should reject next-local-day check-in at the UTC date boundary', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-28T17:30:00.000Z'));
    try {
      const { service, appointmentRepository, historyRepository } =
        createService();
      appointmentRepository.findOne.mockResolvedValue({
        appointment_id: appointmentId,
        appointment_date: new Date('2026-07-30T00:00:00.000+07:00'),
        status: AppointmentStatus.SCHEDULED,
      });

      await expect(
        service.checkIn(appointmentId, actorId, 'RECEPTIONIST'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(appointmentRepository.save).not.toHaveBeenCalled();
      expect(historyRepository.save).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should throw not found when changing status for a missing appointment', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.changeStatus(
        appointmentId,
        {
          status: AppointmentStatus.CONFIRMED,
          changed_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw not found when updating a missing appointment', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(
        appointmentId,
        { notes: 'Nothing to update' },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should query status history with newest records first', async () => {
    const {
      service,
      appointmentRepository,
      historyRepository,
      patientsService,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
    });
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    historyRepository.find.mockResolvedValue([
      {
        appointment_id: appointmentId,
        new_status: AppointmentStatus.CONFIRMED,
      },
    ]);

    const result = await service.getStatusHistory(appointmentId, actorId);

    expect(result).toEqual([
      {
        appointment_id: appointmentId,
        new_status: AppointmentStatus.CONFIRMED,
      },
    ]);
    expect(historyRepository.find).toHaveBeenCalledWith({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  });

  it('should find patient appointments with optional status filter', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId },
    ]);

    const result = await service.findByPatient(
      patientId,
      AppointmentStatus.SCHEDULED,
      actorId,
    );

    expect(result).toEqual([{ appointment_id: appointmentId }]);
    expect(appointmentRepository.find).toHaveBeenCalledWith({
      where: {
        patient_id: patientId,
        status: AppointmentStatus.SCHEDULED,
      },
      relations: ['clinic', 'room', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  });

  it('should reject status history reads for another authenticated patient', async () => {
    const {
      service,
      appointmentRepository,
      historyRepository,
      patientsService,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.getStatusHistory(appointmentId, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(historyRepository.find).not.toHaveBeenCalled();
  });

  it('should reject patient appointment lookup for a different authenticated patient', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.findByPatient(patientId, AppointmentStatus.SCHEDULED, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should reject patient appointment lookup when actor has no patient projection or trusted role', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findByPatient(patientId, AppointmentStatus.SCHEDULED, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should allow receptionist patient appointment lookup without patient projection', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId },
    ]);

    const result = await service.findByPatient(
      patientId,
      AppointmentStatus.SCHEDULED,
      actorId,
      'RECEPTIONIST',
    );

    expect(result).toEqual([{ appointment_id: appointmentId }]);
    expect(appointmentRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patient_id: patientId,
          status: AppointmentStatus.SCHEDULED,
        },
      }),
    );
  });

  it('should reject direct appointment detail reads for another authenticated patient', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.findById(appointmentId, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject direct appointment detail reads for another authenticated doctor', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    });

    await expect(
      service.findById(
        appointmentId,
        'd0000000-0000-0000-0000-000000000002',
        'DOCTOR',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should allow direct appointment detail reads for the assigned doctor', async () => {
    const { service, appointmentRepository } = createService();
    const appointment = {
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    };
    appointmentRepository.findOne.mockResolvedValue(appointment);

    await expect(
      service.findById(appointmentId, doctorId, 'DOCTOR'),
    ).resolves.toBe(appointment);
  });

  it('should reject direct appointment detail reads when actor has no patient projection or trusted role', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    });

    await expect(
      service.findById(appointmentId, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject appointment code reads for another authenticated patient', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      appointment_code: 'APT-20260601-ABCD',
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.findByCode('APT-20260601-ABCD', actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should find doctor appointments for a specific date', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId },
    ]);

    const result = await service.findByDoctor(
      doctorId,
      '2026-06-01',
      actorId,
      'RECEPTIONIST',
    );

    expect(result).toEqual([{ appointment_id: appointmentId }]);
    expect(appointmentRepository.find).toHaveBeenCalledWith({
      where: {
        doctor_id: doctorId,
        appointment_date: new Date('2026-06-01'),
      },
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  });

  it('should find a doctor worklist for checked-in appointments on a date', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId, status: AppointmentStatus.CHECKED_IN },
    ]);

    const result = await service.findDoctorWorklist(
      doctorId,
      '2026-06-01',
      doctorId,
      'DOCTOR',
    );

    expect(result).toEqual([
      { appointment_id: appointmentId, status: AppointmentStatus.CHECKED_IN },
    ]);
    expect(appointmentRepository.find).toHaveBeenCalledWith({
      where: {
        doctor_id: doctorId,
        appointment_date: new Date('2026-06-01'),
        status: AppointmentStatus.CHECKED_IN,
      },
      relations: ['clinic', 'room', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  });

  it('should reject doctor worklist access for another doctor', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findDoctorWorklist(
        doctorId,
        '2026-06-01',
        'd0000000-0000-0000-0000-000000000002',
        'DOCTOR',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should reject doctor worklist access for patient actors', async () => {
    const { service, appointmentRepository, patientsService } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });

    await expect(
      service.findDoctorWorklist(doctorId, '2026-06-01', actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should reject doctor appointment lookup for a different authenticated doctor', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findByDoctor(
        doctorId,
        '2026-06-01',
        'd0000000-0000-0000-0000-000000000002',
        'DOCTOR',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should enforce lowercase doctor role as doctor self-projection', async () => {
    const { service, appointmentRepository } = createService();

    await expect(
      service.findByDoctor(
        doctorId,
        '2026-06-01',
        'd0000000-0000-0000-0000-000000000002',
        'doctor',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(appointmentRepository.find).not.toHaveBeenCalled();
  });

  it('should build confirmation and reminder notifications from appointment details', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      patientsService,
    } = createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    notificationPublisher.sendAppointmentReminder.mockResolvedValue({
      notificationId: 'notification-1',
    });

    await service.sendConfirmation(appointmentId, actorId);
    await service.sendReminder(appointmentId, actorId);

    expect(
      notificationPublisher.sendAppointmentConfirmation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        recipientId: patientUserId,
        notificationType: 'APPOINTMENT_CONFIRMATION',
        relatedEntityType: 'appointment',
      }),
    );
    expect(notificationPublisher.sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        recipientId: patientUserId,
        notificationType: 'APPOINTMENT_REMINDER',
        relatedEntityType: 'appointment',
      }),
    );
  });

  it('should reject a treatment-plan follow-up when original session context differs', async () => {
    const {
      service,
      appointmentRepository,
      examinationSessionsRepository,
      treatmentPlansRepository,
    } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: treatmentPlanId,
      session_id: sessionId,
      patient_id: patientId,
      status: 'accepted',
    });
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: 'd0000000-0000-0000-0000-000000000099',
      clinic_id: clinicId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.create(
        {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: '2026-06-15',
          appointment_time: '09:00',
          appointment_type: AppointmentType.FOLLOW_UP,
          treatment_plan_id: treatmentPlanId,
          created_by: actorId,
        },
        actorId,
        'RECEPTIONIST',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should persist a sent reminder notification log with retry metadata', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      reminderPreferencesRepository,
      notificationLogsRepository,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    reminderPreferencesRepository.findOne.mockResolvedValue({
      patient_id: patientId,
      channel: 'APP',
      enabled: true,
      reminder_minutes_before: 1440,
    });
    notificationPublisher.sendAppointmentReminder.mockResolvedValue({
      notificationId: 'notification-1',
    });

    const result = await service.sendReminder(
      appointmentId,
      actorId,
      'receptionist',
    );

    expect(notificationLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        notification_type: 'APPOINTMENT_REMINDER',
        channel: 'APP',
        status: 'sent',
        attempt_count: 1,
        notification_id: 'notification-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'sent',
        notification_id: 'notification-1',
      }),
    );
  });

  it('should skip reminder publishing when patient reminder preference is disabled', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      reminderPreferencesRepository,
      notificationLogsRepository,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    reminderPreferencesRepository.findOne.mockResolvedValue({
      patient_id: patientId,
      channel: 'APP',
      enabled: false,
      reminder_minutes_before: 1440,
    });

    const result = await service.sendReminder(
      appointmentId,
      actorId,
      'receptionist',
    );

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
    expect(notificationLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        status: 'skipped',
        preference_enabled: false,
      }),
    );
    expect(result.status).toBe('skipped');
  });

  it('should record failed reminder attempts with retry timing', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T10:00:00.000Z'));
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      notificationLogsRepository,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    const rawError =
      'SENTINEL_IAM_ERROR recipient-private@example.test internal-host';
    notificationPublisher.sendAppointmentReminder.mockRejectedValue(
      Object.assign(new Error(rawError), {
        name: 'ServiceUnavailableException',
        code: 'APPOINTMENT_NOTIFICATION_UNAVAILABLE',
      }),
    );

    await expect(
      service.sendReminder(appointmentId, actorId, 'receptionist'),
    ).rejects.toThrow(rawError);

    expect(notificationLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        status: 'failed',
        attempt_count: 1,
        error_message:
          'error_class=ServiceUnavailableException error_code=APPOINTMENT_NOTIFICATION_UNAVAILABLE',
        next_retry_at: new Date('2026-07-04T10:15:00.000Z'),
      }),
    );
    expect(
      JSON.stringify(notificationLogsRepository.create.mock.calls),
    ).not.toContain(rawError);
    jest.useRealTimers();
  });

  it('should mark the latest reminder log as read and responded', async () => {
    const { service, appointmentRepository, notificationLogsRepository } =
      createService();
    const reminderLog = {
      log_id: '99999999-9999-4999-8999-999999999999',
      appointment_id: appointmentId,
      notification_type: 'APPOINTMENT_REMINDER',
      status: 'sent',
      read_at: null,
      responded_at: null,
    };
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    });
    notificationLogsRepository.findOne.mockResolvedValue(reminderLog);

    const readResult = await service.markReminderRead(
      appointmentId,
      actorId,
      'RECEPTIONIST',
    );
    const respondedResult = await service.markReminderResponded(
      appointmentId,
      actorId,
      'RECEPTIONIST',
    );

    expect(readResult.status).toBe('read');
    expect(readResult.read_at).toBeInstanceOf(Date);
    expect(respondedResult.status).toBe('responded');
    expect(respondedResult.responded_at).toBeInstanceOf(Date);
    expect(appointmentRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { appointment_id: appointmentId } }),
    );
  });

  it('should reject reminder log access for another authenticated patient', async () => {
    const {
      service,
      appointmentRepository,
      notificationLogsRepository,
      patientsService,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000099',
    });

    await expect(
      service.findNotificationLogs(appointmentId, actorId, 'PATIENT'),
    ).rejects.toThrow(ForbiddenException);

    expect(notificationLogsRepository.find).not.toHaveBeenCalled();
  });

  it('should return the appointment reminder preference after ownership check', async () => {
    const { service, appointmentRepository, reminderPreferencesRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
    });
    reminderPreferencesRepository.findOne.mockResolvedValue({
      patient_id: patientId,
      channel: 'APP',
      enabled: false,
      reminder_minutes_before: 720,
    });

    const result = await service.getReminderPreferenceForAppointment(
      appointmentId,
      actorId,
      'RECEPTIONIST',
    );

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        enabled: false,
        reminder_minutes_before: 720,
      }),
    );
  });

  it('should retry failed reminder attempts and increment the attempt count', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      reminderPreferencesRepository,
      notificationLogsRepository,
    } = createService();
    const failedLog = {
      log_id: '99999999-9999-4999-8999-999999999999',
      appointment_id: appointmentId,
      notification_type: 'APPOINTMENT_REMINDER',
      status: 'failed',
      attempt_count: 1,
      next_retry_at: new Date('2026-07-04T09:00:00.000Z'),
      error_message: 'IAM down',
    };
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    notificationLogsRepository.findOne.mockResolvedValue(failedLog);
    reminderPreferencesRepository.findOne.mockResolvedValue({
      patient_id: patientId,
      channel: 'APP',
      enabled: true,
      reminder_minutes_before: 1440,
    });
    notificationPublisher.sendAppointmentReminder.mockResolvedValue({
      notificationId: 'notification-retry-1',
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T09:01:00.000Z'));
    const result = await service.retryReminder(
      appointmentId,
      actorId,
      'RECEPTIONIST',
    );

    expect(notificationPublisher.sendAppointmentReminder).toHaveBeenCalled();
    expect(notificationLogsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        attempt_count: 2,
        notification_id: 'notification-retry-1',
        error_message: null,
        next_retry_at: null,
      }),
    );
    expect(result.status).toBe('sent');
    jest.useRealTimers();
  });

  it('should reject reminder retry before the retry window is ready', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      notificationLogsRepository,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    notificationLogsRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      notification_type: 'APPOINTMENT_REMINDER',
      status: 'failed',
      attempt_count: 1,
      next_retry_at: new Date('2026-07-04T09:10:00.000Z'),
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T09:00:00.000Z'));
    await expect(
      service.retryReminder(appointmentId, actorId, 'RECEPTIONIST'),
    ).rejects.toThrow(ConflictException);

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should skip reminder retry when current patient preference is disabled', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      reminderPreferencesRepository,
      notificationLogsRepository,
    } = createService();
    const failedLog = {
      appointment_id: appointmentId,
      notification_type: 'APPOINTMENT_REMINDER',
      status: 'failed',
      attempt_count: 1,
      next_retry_at: new Date('2026-07-04T09:00:00.000Z'),
      error_message: 'IAM down',
    };
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    notificationLogsRepository.findOne.mockResolvedValue(failedLog);
    reminderPreferencesRepository.findOne.mockResolvedValue({
      patient_id: patientId,
      channel: 'APP',
      enabled: false,
      reminder_minutes_before: 720,
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T09:01:00.000Z'));
    const result = await service.retryReminder(
      appointmentId,
      actorId,
      'RECEPTIONIST',
    );

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
    expect(notificationLogsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'skipped',
        preference_enabled: false,
        reminder_minutes_before: 720,
        error_message: null,
        next_retry_at: null,
      }),
    );
    expect(result.status).toBe('skipped');
    jest.useRealTimers();
  });

  it('should reject notification actions for another authenticated patient', async () => {
    const {
      service,
      appointmentRepository,
      notificationPublisher,
      patientsService,
    } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });
    patientsService.findByUserId.mockResolvedValue({
      patient_id: 'p0000000-0000-0000-0000-000000000002',
    });

    await expect(
      service.sendReminder(appointmentId, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('should throw not found and skip notification publishing when appointment is missing', async () => {
    const { service, appointmentRepository, notificationPublisher } =
      createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(service.sendReminder(appointmentId)).rejects.toThrow(
      NotFoundException,
    );
    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
  });
});
