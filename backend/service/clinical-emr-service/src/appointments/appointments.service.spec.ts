import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

const appointmentId = 'a0000000-0000-0000-0000-000000000001';
const patientId = 'p0000000-0000-0000-0000-000000000001';
const doctorId = 'd0000000-0000-0000-0000-000000000001';
const clinicId = 'c0000000-0000-0000-0000-000000000001';
const roomId = 'r0000000-0000-0000-0000-000000000001';
const serviceId = 's0000000-0000-0000-0000-000000000001';
const specialtyId = 'sp000000-0000-0000-0000-000000000001';
const actorId = 'u0000000-0000-0000-0000-000000000001';

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
  const notificationPublisher = {
    sendAppointmentConfirmation: jest.fn(),
    sendAppointmentReminder: jest.fn(),
  };
  const kycEligibilityClient = {
    assertCanBook: jest.fn(() => Promise.resolve(undefined)),
  };

  const service = new AppointmentsService(
    appointmentRepository as any,
    historyRepository as any,
    doctorSpecialtyRepository as any,
    doctorScheduleRepository as any,
    notificationPublisher as any,
    kycEligibilityClient as any,
  );

  return {
    service,
    appointmentRepository,
    historyRepository,
    doctorSpecialtyRepository,
    doctorScheduleRepository,
    notificationPublisher,
    kycEligibilityClient,
  };
}

describe('AppointmentsService', () => {
  it('should reject appointment creation when KYC eligibility fails', async () => {
    const { service, appointmentRepository, kycEligibilityClient } =
      createService();
    kycEligibilityClient.assertCanBook.mockRejectedValue(
      new BadRequestException('KYC_REQUIRED'),
    );

    await expect(
      service.create({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-01',
        appointment_time: '09:00',
        created_by: actorId,
      }),
    ).rejects.toThrow('KYC_REQUIRED');

    expect(kycEligibilityClient.assertCanBook).toHaveBeenCalledWith(actorId);
    expect(appointmentRepository.create).not.toHaveBeenCalled();
    expect(appointmentRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('should create an appointment with a scheduled status history entry', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();

    const result = await service.create({
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      room_id: roomId,
      service_id: serviceId,
      appointment_date: '2026-06-01',
      appointment_time: '09:00',
      duration_minutes: 45,
      created_by: actorId,
    });

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
      service.create({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_date: '2026-06-01',
        appointment_time: '09:00',
        created_by: actorId,
      }),
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

    await service.createBySpecialty({
      specialty_id: specialtyId,
      patient_id: patientId,
      clinic_id: clinicId,
      preferred_date: '2026-06-01',
      preferred_time: '10:30',
      duration_minutes: 30,
      chief_complaint: 'Tooth pain',
      created_by: actorId,
    });

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

  it('should book by doctor when the doctor has scheduled availability', async () => {
    const { service, appointmentRepository, doctorScheduleRepository } =
      createService();
    doctorScheduleRepository.findOne.mockResolvedValue({ doctor_id: doctorId });

    await service.createByDoctor({
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      room_id: roomId,
      service_id: serviceId,
      appointment_date: '2026-06-01',
      appointment_time: '11:00',
      appointment_type: 'consultation',
      duration_minutes: 30,
      chief_complaint: 'Jaw pain',
      notes: 'Prefers morning',
      created_by: actorId,
    });

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
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        room_id: roomId,
        service_id: serviceId,
        appointment_type: 'consultation',
        chief_complaint: 'Jaw pain',
        notes: 'Prefers morning',
      }),
    );
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

    await service.createBySpecialty({
      specialty_id: specialtyId,
      patient_id: patientId,
      clinic_id: clinicId,
      preferred_date: '2026-06-01',
      created_by: actorId,
    });

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

    await service.createOutsideHours({
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      appointment_date: '2026-06-01',
      appointment_time: '20:30',
      outside_hours_reason: 'Emergency pain',
      approved_by: actorId,
      created_by: actorId,
    });

    expect(appointmentRepository.manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        is_outside_hours: true,
        outside_hours_reason: 'Emergency pain',
        approved_by: actorId,
      }),
    );
  });

  it('should update appointment date, time, type, duration, and notes', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.IN_PROGRESS,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });

    await service.update(appointmentId, {
      appointment_date: '2026-06-02',
      appointment_time: '13:30',
      appointment_type: 'follow_up',
      duration_minutes: 60,
      notes: 'Updated by receptionist',
    });

    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_date: new Date('2026-06-02'),
        appointment_time: '13:30',
        appointment_type: 'follow_up',
        duration_minutes: 60,
        notes: 'Updated by receptionist',
      }),
    );
  });

  it('should list appointments with pagination, filters, and date range', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findAndCount.mockResolvedValue([
      [{ appointment_id: appointmentId }],
      1,
    ]);

    const result = await service.findAll({
      page: 3,
      limit: 5,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: AppointmentStatus.CONFIRMED,
      appointment_type: 'consultation',
      payment_status: 'paid',
      is_outside_hours: false,
      date_from: '2026-06-01',
      date_to: '2026-06-30',
    });

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
          appointment_type: 'consultation',
          payment_status: 'paid',
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
    const { service, appointmentRepository } = createService();
    appointmentRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll({
      appointment_date: '2026-06-15',
      date_from: '2026-06-01',
      date_to: '2026-06-30',
    });

    expect(appointmentRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          appointment_date: new Date('2026-06-15'),
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

    await service.cancel(appointmentId, {
      cancelled_by: actorId,
      cancellation_reason: 'Patient unavailable',
    });

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

    await service.cancel(appointmentId, { cancelled_by: actorId });

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

    await service.confirm(appointmentId, actorId);

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

  it('should change appointment status with a nullable history reason', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.IN_PROGRESS,
    });

    await service.changeStatus(appointmentId, {
      status: AppointmentStatus.COMPLETED,
      changed_by: actorId,
    });

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
      service.changeStatus(appointmentId, {
        status: AppointmentStatus.CONFIRMED,
        changed_by: actorId,
      }),
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
      service.cancel(appointmentId, {
        cancelled_by: actorId,
        cancellation_reason: 'Too late',
      }),
    ).rejects.toThrow(ConflictException);

    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });

  it('should check in a scheduled appointment and record status history', async () => {
    const { service, appointmentRepository, historyRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.SCHEDULED,
    });

    await service.checkIn(appointmentId, actorId);

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

  it('should throw not found when changing status for a missing appointment', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.changeStatus(appointmentId, {
        status: AppointmentStatus.CONFIRMED,
        changed_by: actorId,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw not found when updating a missing appointment', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(appointmentId, { notes: 'Nothing to update' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should query status history with newest records first', async () => {
    const { service, historyRepository } = createService();
    historyRepository.find.mockResolvedValue([
      {
        appointment_id: appointmentId,
        new_status: AppointmentStatus.CONFIRMED,
      },
    ]);

    const result = await service.getStatusHistory(appointmentId);

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
    const { service, appointmentRepository } = createService();
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId },
    ]);

    const result = await service.findByPatient(
      patientId,
      AppointmentStatus.SCHEDULED,
    );

    expect(result).toEqual([{ appointment_id: appointmentId }]);
    expect(appointmentRepository.find).toHaveBeenCalledWith({
      where: {
        patient_id: patientId,
        status: AppointmentStatus.SCHEDULED,
      },
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  });

  it('should find doctor appointments for a specific date', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.find.mockResolvedValue([
      { appointment_id: appointmentId },
    ]);

    const result = await service.findByDoctor(doctorId, '2026-06-01');

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

  it('should build confirmation and reminder notifications from appointment details', async () => {
    const { service, appointmentRepository, notificationPublisher } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: 'APT-20260601-ABCD',
      patient_id: patientId,
      appointment_date: new Date('2026-06-01'),
      appointment_time: '09:00',
    });

    await service.sendConfirmation(appointmentId);
    await service.sendReminder(appointmentId);

    expect(
      notificationPublisher.sendAppointmentConfirmation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        recipientId: patientId,
        notificationType: 'APPOINTMENT_CONFIRMATION',
        relatedEntityType: 'appointment',
      }),
    );
    expect(notificationPublisher.sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        recipientId: patientId,
        notificationType: 'APPOINTMENT_REMINDER',
        relatedEntityType: 'appointment',
      }),
    );
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
