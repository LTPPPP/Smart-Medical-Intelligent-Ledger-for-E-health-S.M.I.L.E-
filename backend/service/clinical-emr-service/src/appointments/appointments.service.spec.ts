import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  return {
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
  };
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

  const service = new AppointmentsService(
    appointmentRepository as any,
    historyRepository as any,
    doctorSpecialtyRepository as any,
    doctorScheduleRepository as any,
    notificationPublisher as any,
  );

  return {
    service,
    appointmentRepository,
    historyRepository,
    doctorSpecialtyRepository,
    doctorScheduleRepository,
    notificationPublisher,
  };
}

describe('AppointmentsService', () => {
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
    expect(appointmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_code: expect.stringMatching(/^APT-\d{8}-[A-Z0-9]{4}$/),
        appointment_date: new Date('2026-06-01'),
      }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        old_status: null,
        new_status: AppointmentStatus.SCHEDULED,
        changed_by: actorId,
        reason: 'Appointment created',
      }),
    );
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
    expect(appointmentRepository.create).toHaveBeenCalledWith(
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

    expect(appointmentRepository.create).toHaveBeenCalledWith(
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
      status: AppointmentStatus.SCHEDULED,
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

  it('should throw not found when updating a missing appointment', async () => {
    const { service, appointmentRepository } = createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(appointmentId, { notes: 'Nothing to update' }),
    ).rejects.toThrow(NotFoundException);
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
});
