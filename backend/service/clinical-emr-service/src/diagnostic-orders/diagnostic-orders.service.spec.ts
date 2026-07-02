import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DiagnosticOrdersService } from './diagnostic-orders.service';
import { OrderType } from '../utils/enums/order-type.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('DiagnosticOrdersService', () => {
  const appointmentId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const orderRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new DiagnosticOrdersService(
      orderRepository as any,
      sessionsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'in_progress',
      signed_at: null,
    });

    return { service, orderRepository, sessionsRepository };
  }

  it('rejects creating a diagnostic order when appointment has no examination session', async () => {
    const { service, orderRepository, sessionsRepository } = createService();
    sessionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        order_type: OrderType.X_RAY,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects creating a diagnostic order for a finalized session', async () => {
    const { service, orderRepository, sessionsRepository } = createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        order_type: OrderType.CBCT,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects diagnostic order patient or doctor mismatch with session', async () => {
    const { service } = createService();

    await expect(
      service.create({
        appointment_id: appointmentId,
        patient_id: '77777777-7777-4777-8777-777777777777',
        doctor_id: doctorId,
        order_type: OrderType.X_RAY,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates an ordered diagnostic order for an active examination session', async () => {
    const { service, orderRepository } = createService();

    const result = await service.create({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      order_type: OrderType.X_RAY,
    });

    expect(result).toEqual(
      expect.objectContaining({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        order_type: OrderType.X_RAY,
        status: 'ordered',
        ordered_at: expect.any(Date),
      }),
    );
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        status: 'ordered',
      }),
    );
  });

  it('rejects deleting a diagnostic order after its appointment session is finalized', async () => {
    const { service, orderRepository, sessionsRepository } = createService();
    orderRepository.findOne.mockResolvedValue({
      order_id: '55555555-5555-4555-8555-555555555555',
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      order_type: OrderType.X_RAY,
      status: 'ordered',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      appointment_id: appointmentId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.remove('55555555-5555-4555-8555-555555555555'),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.remove).not.toHaveBeenCalled();
  });
});
