import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClinicalOrdersService } from './clinical-orders.service';
import { OrderType } from '../utils/enums/order-type.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('ClinicalOrdersService', () => {
  const orderId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';
  const recordId = '55555555-5555-4555-8555-555555555555';

  function createService() {
    const clinicalOrdersRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new ClinicalOrdersService(
      clinicalOrdersRepository as any,
      sessionsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'in_progress',
      signed_at: null,
    });

    return { service, clinicalOrdersRepository, sessionsRepository };
  }

  it('should require a session when creating a clinical order', async () => {
    const { service, clinicalOrdersRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        ordered_by: doctorId,
        order_type: OrderType.LAB_TEST,
        test_type: 'blood_test',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(clinicalOrdersRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating a clinical order for a finalized session', async () => {
    const { service, clinicalOrdersRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        ordered_by: doctorId,
        order_type: OrderType.LAB_TEST,
        test_type: 'blood_test',
      }),
    ).rejects.toThrow(ConflictException);

    expect(clinicalOrdersRepository.save).not.toHaveBeenCalled();
  });

  it('should create an ordered clinical order linked to the session context', async () => {
    const { service, clinicalOrdersRepository } = createService();

    const result = await service.create({
      session_id: sessionId,
      patient_id: patientId,
      ordered_by: doctorId,
      order_type: OrderType.LAB_TEST,
      test_type: 'blood_test',
    });

    expect(result).toEqual(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        record_id: recordId,
        ordered_by: doctorId,
        status: 'ordered',
      }),
    );
    expect(clinicalOrdersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        record_id: recordId,
        ordered_by: doctorId,
        status: 'ordered',
      }),
    );
  });

  it('should list clinical orders by exact examination session', async () => {
    const { service, clinicalOrdersRepository } = createService();
    clinicalOrdersRepository.find.mockResolvedValue([
      {
        order_id: orderId,
        session_id: sessionId,
        patient_id: patientId,
      },
    ]);

    const result = await service.findBySessionId(sessionId);

    expect(result).toEqual([
      expect.objectContaining({
        order_id: orderId,
        session_id: sessionId,
      }),
    ]);
    expect(clinicalOrdersRepository.find).toHaveBeenCalledWith({
      where: { session_id: sessionId },
    });
  });

  it('should throw not found when the linked session is missing', async () => {
    const { service, sessionsRepository } = createService();
    sessionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        ordered_by: doctorId,
        order_type: OrderType.LAB_TEST,
        test_type: 'blood_test',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject changing clinical order session context after creation', async () => {
    const { service, clinicalOrdersRepository } = createService();
    clinicalOrdersRepository.findOne.mockResolvedValue({
      order_id: orderId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      ordered_by: doctorId,
      order_type: OrderType.LAB_TEST,
      test_type: 'blood_test',
      status: 'ordered',
    });

    await expect(
      service.update(orderId, {
        patient_id: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject deleting a clinical order after its session is finalized', async () => {
    const { service, clinicalOrdersRepository, sessionsRepository } =
      createService();
    clinicalOrdersRepository.findOne.mockResolvedValue({
      order_id: orderId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      ordered_by: doctorId,
      order_type: OrderType.LAB_TEST,
      test_type: 'blood_test',
      status: 'ordered',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(service.remove(orderId)).rejects.toThrow(ConflictException);

    expect(clinicalOrdersRepository.remove).not.toHaveBeenCalled();
  });
});
