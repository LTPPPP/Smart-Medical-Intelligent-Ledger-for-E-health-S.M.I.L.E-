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
    createOutsideHours: jest.fn(),
    findAll: jest.fn(),
    findByCode: jest.fn(),
    update: jest.fn(),
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

  return {
    controller: new AppointmentsController(appointmentsService as any),
    appointmentsService,
  };
}

describe('AppointmentsController', () => {
  it('should return an appointment by code when it exists', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByCode.mockResolvedValue({
      appointment_id: appointmentId,
      appointment_code: appointmentCode,
    });

    await expect(controller.findByCode(appointmentCode)).resolves.toEqual({
      appointment_id: appointmentId,
      appointment_code: appointmentCode,
    });
    expect(appointmentsService.findByCode).toHaveBeenCalledWith(
      appointmentCode,
    );
  });

  it('should throw not found when appointment code does not exist', async () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByCode.mockResolvedValue(null);

    await expect(controller.findByCode(appointmentCode)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw bad request when confirming without changed_by', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.confirm(appointmentId, '')).toThrow(
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

    expect(controller.confirm(appointmentId, actorId)).toEqual({
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

    await expect(controller.findOne(appointmentId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delegate patient and doctor lookup queries to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.findByPatient.mockReturnValue([]);
    appointmentsService.findByDoctor.mockReturnValue([]);

    expect(
      controller.findByPatient(patientId, AppointmentStatus.SCHEDULED),
    ).toEqual([]);
    expect(controller.findByDoctor(doctorId, '2026-06-01')).toEqual([]);
    expect(appointmentsService.findByPatient).toHaveBeenCalledWith(
      patientId,
      AppointmentStatus.SCHEDULED,
    );
    expect(appointmentsService.findByDoctor).toHaveBeenCalledWith(
      doctorId,
      '2026-06-01',
    );
  });

  it('should delegate appointment notification actions to the service', () => {
    const { controller, appointmentsService } = createController();
    appointmentsService.sendConfirmation.mockReturnValue({ queued: true });
    appointmentsService.sendReminder.mockReturnValue({ queued: true });

    expect(controller.sendConfirmation(appointmentId)).toEqual({
      queued: true,
    });
    expect(controller.sendReminder(appointmentId)).toEqual({ queued: true });
    expect(appointmentsService.sendConfirmation).toHaveBeenCalledWith(
      appointmentId,
    );
    expect(appointmentsService.sendReminder).toHaveBeenCalledWith(
      appointmentId,
    );
  });

  it('should throw bad request when checking in without checked_in_by', () => {
    const { controller, appointmentsService } = createController();

    expect(() => controller.checkIn(appointmentId, '')).toThrow(
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

    expect(controller.checkIn(appointmentId, actorId)).toEqual({
      appointment_id: appointmentId,
      status: AppointmentStatus.CHECKED_IN,
    });
    expect(appointmentsService.checkIn).toHaveBeenCalledWith(
      appointmentId,
      actorId,
    );
  });
});
