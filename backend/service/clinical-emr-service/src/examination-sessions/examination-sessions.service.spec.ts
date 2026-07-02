import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ExaminationSessionsService } from './examination-sessions.service';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('ExaminationSessionsService', () => {
  const appointmentId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';
  const doctorId = '33333333-3333-4333-8333-333333333333';
  const clinicId = '44444444-4444-4444-8444-444444444444';
  const recordId = '55555555-5555-4555-8555-555555555555';

  function createService() {
    const examinationSessionsRepository = createRepositoryMock();
    const appointmentRepository = createRepositoryMock();
    const historyRepository = createRepositoryMock();
    const diagnosesRepository = createRepositoryMock();
    const medicalRecordsService = {
      finalize: jest.fn(async () => undefined),
    };
    const service = new ExaminationSessionsService(
      examinationSessionsRepository as any,
      appointmentRepository as any,
      historyRepository as any,
      diagnosesRepository as any,
      medicalRecordsService as any,
    );

    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: AppointmentStatus.CHECKED_IN,
    });
    examinationSessionsRepository.findOne.mockResolvedValue(null);

    return {
      service,
      examinationSessionsRepository,
      appointmentRepository,
      historyRepository,
      diagnosesRepository,
      medicalRecordsService,
    };
  }

  it('requires an appointment when starting an examination session', async () => {
    const { service, examinationSessionsRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects starting an examination for a missing appointment', async () => {
    const { service, appointmentRepository, examinationSessionsRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects starting an examination before patient check-in', async () => {
    const { service, appointmentRepository, examinationSessionsRepository } =
      createService();
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: AppointmentStatus.CONFIRMED,
    });

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a doctor mismatch for the appointment', async () => {
    const { service, examinationSessionsRepository } = createService();

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: '66666666-6666-4666-8666-666666666666',
        clinic_id: clinicId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate active sessions for the same appointment', async () => {
    const { service, examinationSessionsRepository } = createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: '77777777-7777-4777-8777-777777777777',
      appointment_id: appointmentId,
      status: 'in_progress',
    });

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });

  it('creates a session linked to the checked-in appointment and marks the appointment in progress', async () => {
    const {
      service,
      examinationSessionsRepository,
      appointmentRepository,
      historyRepository,
    } = createService();

    const result = await service.create({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      record_id: recordId,
      chief_complaint: 'Tooth pain',
    });

    expect(examinationSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        record_id: recordId,
        chief_complaint: 'Tooth pain',
        status: 'in_progress',
      }),
    );
    expect(result.appointment_id).toBe(appointmentId);
    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        status: AppointmentStatus.IN_PROGRESS,
      }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        old_status: AppointmentStatus.CHECKED_IN,
        new_status: AppointmentStatus.IN_PROGRESS,
        reason: 'Examination session started',
      }),
    );
  });

  it('finds the examination session for an appointment', async () => {
    const { service, examinationSessionsRepository } = createService();
    const session = {
      session_id: '88888888-8888-4888-8888-888888888888',
      appointment_id: appointmentId,
    };
    examinationSessionsRepository.findOne.mockResolvedValue(session);

    await expect(service.findByAppointmentId(appointmentId)).resolves.toBe(
      session,
    );
    expect(examinationSessionsRepository.findOne).toHaveBeenCalledWith({
      where: { appointment_id: appointmentId },
    });
  });

  it('rejects finalize when the session has no minimum clinical note', async () => {
    const { service, examinationSessionsRepository, diagnosesRepository } =
      createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: '88888888-8888-4888-8888-888888888888',
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'in_progress',
      chief_complaint: ' ',
      present_illness: null,
      physical_examination: null,
    });
    diagnosesRepository.count.mockResolvedValue(1);

    await expect(
      service.finalize('88888888-8888-4888-8888-888888888888'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects finalize when the session has no diagnosis', async () => {
    const { service, examinationSessionsRepository, diagnosesRepository } =
      createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: '88888888-8888-4888-8888-888888888888',
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'in_progress',
      chief_complaint: 'Tooth pain',
      present_illness: null,
      physical_examination: null,
    });
    diagnosesRepository.count.mockResolvedValue(0);

    await expect(
      service.finalize('88888888-8888-4888-8888-888888888888'),
    ).rejects.toThrow(BadRequestException);
  });

  it('finalizes a valid session, signs it by the doctor, and completes the appointment', async () => {
    const {
      service,
      examinationSessionsRepository,
      appointmentRepository,
      historyRepository,
      diagnosesRepository,
      medicalRecordsService,
    } = createService();
    const session = {
      session_id: '88888888-8888-4888-8888-888888888888',
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'in_progress',
      chief_complaint: 'Tooth pain',
      present_illness: null,
      physical_examination: null,
      record_id: recordId,
      completed_at: null,
      signed_at: null,
      signed_by: null,
    };
    examinationSessionsRepository.findOne.mockResolvedValue(session);
    diagnosesRepository.count.mockResolvedValue(1);
    appointmentRepository.findOne.mockResolvedValue({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: AppointmentStatus.IN_PROGRESS,
    });

    const result = await service.finalize(session.session_id);

    expect(result.status).toBe('completed');
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.signed_at).toBeInstanceOf(Date);
    expect(result.signed_by).toBe(doctorId);
    expect(appointmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        status: AppointmentStatus.COMPLETED,
      }),
    );
    expect(historyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        old_status: AppointmentStatus.IN_PROGRESS,
        new_status: AppointmentStatus.COMPLETED,
        reason: 'Examination session finalized',
      }),
    );
    expect(medicalRecordsService.finalize).toHaveBeenCalledWith(
      recordId,
      doctorId,
    );
  });

  it('rejects updates after a session is finalized', async () => {
    const { service, examinationSessionsRepository } = createService();
    examinationSessionsRepository.findOne.mockResolvedValue({
      session_id: '88888888-8888-4888-8888-888888888888',
      status: 'completed',
    });

    await expect(
      service.update('88888888-8888-4888-8888-888888888888', {
        chief_complaint: 'Updated after sign',
      }),
    ).rejects.toThrow(ConflictException);

    expect(examinationSessionsRepository.save).not.toHaveBeenCalled();
  });
});
