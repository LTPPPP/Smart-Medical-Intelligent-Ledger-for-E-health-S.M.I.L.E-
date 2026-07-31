import { NotFoundException } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

const appointmentId = 'a0000000-0000-0000-0000-000000000001';
const appointmentCode = 'APT-20260601-ABCD';
const patientId = 'p0000000-0000-0000-0000-000000000001';
const doctorId = 'd0000000-0000-0000-0000-000000000001';
const actorId = 'u0000000-0000-0000-0000-000000000001';
const actor = (role?: string) => ({ accountId: actorId, role });

function createController() {
  const appointmentsService = {
    create: jest.fn(),
    createBySpecialty: jest.fn(),
    createByDoctor: jest.fn(),
    createByOption: jest.fn(),
    createOutsideHours: jest.fn(),
    findAll: jest.fn(),
    findByCode: jest.fn(),
    update: jest.fn(),
    rescheduleByOption: jest.fn(),
    changeStatus: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    getStatusHistory: jest.fn(),
    findByPatient: jest.fn(),
    findByDoctor: jest.fn(),
    findDoctorWorklist: jest.fn(),
    findById: jest.fn(),
    sendConfirmation: jest.fn(),
    sendReminder: jest.fn(),
    retryReminder: jest.fn(),
    getReminderPreferenceForAppointment: jest.fn(),
    setReminderPreferenceForAppointment: jest.fn(),
    markReminderRead: jest.fn(),
    markReminderResponded: jest.fn(),
    findNotificationLogs: jest.fn(),
    checkIn: jest.fn(),
  };
  const availabilityService = {
    findAvailability: jest.fn(),
  };

  return {
    controller: new AppointmentsController(
      appointmentsService as any,
      availabilityService as any,
    ),
    appointmentsService,
    availabilityService,
  };
}

describe('AppointmentsController', () => {
  it('should return an appointment by code when it exists', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByCode.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: appointmentCode,
    });

    await expect(
      controller.findByCode(appointmentCode, actor('DOCTOR')),
    ).resolves.toEqual({
      appointment_id: appointmentId,
      appointment_code: appointmentCode,
    });
    expect(appointmentsService.findByCode).toHaveBeenCalledWith(
      appointmentCode,
      actorId,
      'DOCTOR',
    );
  });

  it('should throw not found when appointment code does not exist', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByCode.mockResolvedValue(null);

    await expect(
      controller.findByCode(appointmentCode, actor()),
    ).rejects.toThrow(NotFoundException);
  });

  it('should confirm through the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.confirm.mockReturnValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.CONFIRMED,
    });

    expect(controller.confirm(appointmentId, actor('DOCTOR'))).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CONFIRMED,
    });
    expect(appointmentsService.confirm).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
  });

  it('should throw not found when appointment id does not exist', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findById.mockResolvedValue(null);

    await expect(
      controller.findOne(appointmentId, actor('DOCTOR')),
    ).rejects.toThrow(NotFoundException);
    expect(appointmentsService.findById).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
  });

  it('should delegate patient and doctor lookup queries to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByPatient.mockReturnValue([]);
    appointmentsService.findByDoctor.mockReturnValue([]);

    expect(
      controller.findByPatient(
        patientId,
        actor('RECEPTIONIST'),
        AppointmentStatus.SCHEDULED,
      ),
    ).toEqual([]);
    expect(
      controller.findByDoctor(doctorId, actor('DOCTOR'), '2026-06-01'),
    ).toEqual([]);
    expect(appointmentsService.findByPatient).toHaveBeenCalledWith(
      patientId,
      AppointmentStatus.SCHEDULED,
      actorId,
      'RECEPTIONIST',
    );
    expect(appointmentsService.findByDoctor).toHaveBeenCalledWith(
      doctorId,
      '2026-06-01',
      actorId,
      'DOCTOR',
    );
  });

  it('should delegate doctor worklist lookup to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findDoctorWorklist.mockReturnValue([]);

    expect(
      controller.findDoctorWorklist(doctorId, actor('DOCTOR'), '2026-06-01'),
    ).toEqual([]);
    expect(appointmentsService.findDoctorWorklist).toHaveBeenCalledWith(
      doctorId,
      '2026-06-01',
      actorId,
      'DOCTOR',
    );
  });

  it('should pass trusted actor role to cancellation actions', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.cancel.mockReturnValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.CANCELLED,
    });

    const dto = {
      cancelled_by: actorId,
      cancellation_reason: 'Clinic request',
    };

    expect(controller.cancel(appointmentId, dto, actor('DOCTOR'))).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CANCELLED,
    });
    expect(appointmentsService.cancel).toHaveBeenCalledWith(
      appointmentId,
      dto,
      actorId,
      'DOCTOR',
    );
  });

  it('should pass trusted actor role to list queries', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findAll.mockReturnValue({ data: [], total: 0 });

    expect(
      controller.findAll(
        { doctor_id: doctorId, status: AppointmentStatus.SCHEDULED },
        actor('DOCTOR'),
      ),
    ).toEqual({ data: [], total: 0 });

    expect(appointmentsService.findAll).toHaveBeenCalledWith(
      { doctor_id: doctorId, status: AppointmentStatus.SCHEDULED },
      actorId,
      'DOCTOR',
    );
  });

  it('should pass trusted actor role to appointment creation', () => {
    const { controller, appointmentsService } = createController();
    const dto = {
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: 'c0000000-0000-0000-0000-000000000001',
      appointment_date: '2026-06-01',
      appointment_time: '09:00',
      created_by: actorId,
    };
    appointmentsService.create.mockReturnValue({
      appointment_id: appointmentId,
    });

    expect(controller.create(dto, actor('RECEPTIONIST'))).toEqual({
      appointment_id: appointmentId,
    });
    expect(appointmentsService.create).toHaveBeenCalledWith(
      dto,
      actorId,
      'RECEPTIONIST',
    );
  });

  it('should delegate availability lookup to the availability service', () => {
    const { controller, availabilityService } = createController();
    availabilityService.findAvailability.mockReturnValue({ dates: [] });

    const query = {
      patient_id: patientId,
      service_id: 's0000000-0000-0000-0000-000000000001',
      date_from: '2026-06-30',
      date_to: '2026-06-30',
    };

    expect(controller.findAvailability(query, actor())).toEqual({ dates: [] });
    expect(availabilityService.findAvailability).toHaveBeenCalledWith(
      query,
      actorId,
    );
  });

  it('should book from an availability option token through the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.createByOption.mockReturnValue({
      appointment_id: appointmentId,
    });

    const dto = {
      patient_id: patientId,
      option_token: 'opaque-slot-token',
      created_by: actorId,
    };

    expect(controller.createByOption(dto, actor())).toEqual({
      appointment_id: appointmentId,
    });
    expect(appointmentsService.createByOption).toHaveBeenCalledWith(
      dto,
      actorId,
      undefined,
    );
  });

  it('should reschedule from an availability option token through the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.rescheduleByOption.mockReturnValue({
      appointment_id: appointmentId,
    });

    const dto = {
      option_token: 'opaque-slot-token',
      updated_by: actorId,
    };

    expect(
      controller.rescheduleByOption(appointmentId, dto, actor('DOCTOR')),
    ).toEqual({
      appointment_id: appointmentId,
    });
    expect(appointmentsService.rescheduleByOption).toHaveBeenCalledWith(
      appointmentId,
      dto,
      actorId,
      'DOCTOR',
    );
  });

  it('should delegate appointment notification actions to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.sendConfirmation.mockReturnValue({ queued: true });
    appointmentsService.sendReminder.mockReturnValue({ queued: true });
    appointmentsService.retryReminder.mockReturnValue({ queued: true });
    appointmentsService.getReminderPreferenceForAppointment.mockReturnValue({
      enabled: true,
    });
    appointmentsService.markReminderRead.mockReturnValue({ status: 'read' });
    appointmentsService.markReminderResponded.mockReturnValue({
      status: 'responded',
    });
    appointmentsService.findNotificationLogs.mockReturnValue([]);

    expect(controller.sendConfirmation(appointmentId, actor('DOCTOR'))).toEqual(
      {
        queued: true,
      },
    );
    expect(controller.sendReminder(appointmentId, actor('DOCTOR'))).toEqual({
      queued: true,
    });
    expect(controller.retryReminder(appointmentId, actor('DOCTOR'))).toEqual({
      queued: true,
    });
    expect(
      controller.getReminderPreference(appointmentId, actor('DOCTOR')),
    ).toEqual({
      enabled: true,
    });
    expect(controller.markReminderRead(appointmentId, actor('DOCTOR'))).toEqual(
      {
        status: 'read',
      },
    );
    expect(
      controller.markReminderResponded(appointmentId, actor('DOCTOR')),
    ).toEqual({
      status: 'responded',
    });
    expect(
      controller.findNotificationLogs(appointmentId, actor('DOCTOR')),
    ).toEqual([]);
    expect(appointmentsService.sendConfirmation).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
    expect(appointmentsService.sendReminder).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
    expect(appointmentsService.retryReminder).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
    expect(
      appointmentsService.getReminderPreferenceForAppointment,
    ).toHaveBeenCalledWith(appointmentId, actorId, 'DOCTOR');
    expect(appointmentsService.markReminderRead).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
    expect(appointmentsService.markReminderResponded).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
    expect(appointmentsService.findNotificationLogs).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
  });

  it('should check in through the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.checkIn.mockReturnValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.CHECKED_IN,
    });

    expect(controller.checkIn(appointmentId, actor('DOCTOR'))).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CHECKED_IN,
    });
    expect(appointmentsService.checkIn).toHaveBeenCalledWith(
      appointmentId,
      actorId,
      'DOCTOR',
    );
  });
});
