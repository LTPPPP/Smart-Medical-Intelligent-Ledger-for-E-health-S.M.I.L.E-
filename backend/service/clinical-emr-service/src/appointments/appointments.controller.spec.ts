import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

const appointmentId = 'a0000000-0000-0000-0000-000000000001';
const appointmentCode = 'APT-20260601-ABCD';
const patientId = 'p0000000-0000-0000-0000-000000000001';
const doctorId = 'd0000000-0000-0000-0000-000000000001';
const actorId = 'u0000000-0000-0000-0000-000000000001';

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
    findById: jest.fn(),
    sendConfirmation: jest.fn(),
    sendReminder: jest.fn(),
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
      controller.findByCode(appointmentCode, actorId),
    ).resolves.toEqual({
      appointment_id: appointmentId,
      appointment_code: appointmentCode,
    });
    expect(appointmentsService.findByCode).toHaveBeenCalledWith(
      appointmentCode,
      actorId,
    );
  });

  it('should throw not found when appointment code does not exist', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByCode.mockResolvedValue(null);

    await expect(
      controller.findByCode(appointmentCode, actorId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw bad request when confirming without changed_by', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.confirm(appointmentId, '', actorId)).toThrow(
      BadRequestException,
    );
    expect(appointmentsService.confirm).not.toHaveBeenCalled();
  });

  it('should confirm through the service when changed_by is present', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.confirm.mockReturnValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.CONFIRMED,
    });

    expect(controller.confirm(appointmentId, actorId, actorId)).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CONFIRMED,
    });
    expect(appointmentsService.confirm).toHaveBeenCalledWith(
      appointmentId,
      actorId,
    );
  });

  it('should throw not found when appointment id does not exist', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findById.mockResolvedValue(null);

    await expect(controller.findOne(appointmentId, actorId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delegate patient and doctor lookup queries to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByPatient.mockReturnValue([]);
    appointmentsService.findByDoctor.mockReturnValue([]);

    expect(
      controller.findByPatient(patientId, AppointmentStatus.SCHEDULED, actorId),
    ).toEqual([]);
    expect(controller.findByDoctor(doctorId, '2026-06-01', actorId)).toEqual(
      [],
    );
    expect(appointmentsService.findByPatient).toHaveBeenCalledWith(
      patientId,
      AppointmentStatus.SCHEDULED,
      actorId,
    );
    expect(appointmentsService.findByDoctor).toHaveBeenCalledWith(
      doctorId,
      '2026-06-01',
      actorId,
    );
  });

  it('should require an authenticated actor for appointment read routes', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.findAll({})).toThrow(BadRequestException);
    expect(() => controller.findByPatient(patientId)).toThrow(
      BadRequestException,
    );
    expect(() => controller.findByDoctor(doctorId)).toThrow(
      BadRequestException,
    );

    expect(appointmentsService.findAll).not.toHaveBeenCalled();
    expect(appointmentsService.findByPatient).not.toHaveBeenCalled();
    expect(appointmentsService.findByDoctor).not.toHaveBeenCalled();
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

    expect(controller.findAvailability(query, actorId)).toEqual({ dates: [] });
    expect(availabilityService.findAvailability).toHaveBeenCalledWith(
      query,
      actorId,
    );
  });

  it('should require an authenticated actor for availability lookup', () => {
    const { controller, availabilityService } = createController();

    expect(() =>
      controller.findAvailability({
        patient_id: patientId,
        service_id: 's0000000-0000-0000-0000-000000000001',
        date_from: '2026-06-30',
        date_to: '2026-06-30',
      }),
    ).toThrow(BadRequestException);
    expect(availabilityService.findAvailability).not.toHaveBeenCalled();
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

    expect(controller.createByOption(dto, actorId)).toEqual({
      appointment_id: appointmentId,
    });
    expect(appointmentsService.createByOption).toHaveBeenCalledWith(
      dto,
      actorId,
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

    expect(controller.rescheduleByOption(appointmentId, dto, actorId)).toEqual({
      appointment_id: appointmentId,
    });
    expect(appointmentsService.rescheduleByOption).toHaveBeenCalledWith(
      appointmentId,
      dto,
      actorId,
    );
  });

  it('should delegate appointment notification actions to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.sendConfirmation.mockReturnValue({ queued: true });
    appointmentsService.sendReminder.mockReturnValue({ queued: true });

    expect(controller.sendConfirmation(appointmentId, actorId)).toEqual({
      queued: true,
    });
    expect(controller.sendReminder(appointmentId, actorId)).toEqual({
      queued: true,
    });
    expect(appointmentsService.sendConfirmation).toHaveBeenCalledWith(
      appointmentId,
      actorId,
    );
    expect(appointmentsService.sendReminder).toHaveBeenCalledWith(
      appointmentId,
      actorId,
    );
  });

  it('should require an authenticated actor for history and notification routes', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.getStatusHistory(appointmentId)).toThrow(
      BadRequestException,
    );
    expect(() => controller.sendConfirmation(appointmentId)).toThrow(
      BadRequestException,
    );
    expect(() => controller.sendReminder(appointmentId)).toThrow(
      BadRequestException,
    );

    expect(appointmentsService.getStatusHistory).not.toHaveBeenCalled();
    expect(appointmentsService.sendConfirmation).not.toHaveBeenCalled();
    expect(appointmentsService.sendReminder).not.toHaveBeenCalled();
  });

  it('should throw bad request when checking in without checked_in_by', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.checkIn(appointmentId, '', actorId)).toThrow(
      BadRequestException,
    );
    expect(appointmentsService.checkIn).not.toHaveBeenCalled();
  });

  it('should check in through the service when checked_in_by is present', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.checkIn.mockReturnValue({
      appointment_id: appointmentId,
      status: AppointmentStatus.CHECKED_IN,
    });

    expect(controller.checkIn(appointmentId, actorId, actorId)).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CHECKED_IN,
    });
    expect(appointmentsService.checkIn).toHaveBeenCalledWith(
      appointmentId,
      actorId,
    );
  });
});
