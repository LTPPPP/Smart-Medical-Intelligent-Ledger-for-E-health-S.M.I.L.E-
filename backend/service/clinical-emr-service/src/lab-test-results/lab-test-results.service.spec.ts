import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LabTestResultsService } from './lab-test-results.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('LabTestResultsService', () => {
  const resultId = '11111111-1111-4111-8111-111111111111';
  const orderId = '22222222-2222-4222-8222-222222222222';
  const sessionId = '33333333-3333-4333-8333-333333333333';

  function createService() {
    const labTestResultsRepository = createRepositoryMock();
    const clinicalOrdersRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new LabTestResultsService(
      labTestResultsRepository as any,
      clinicalOrdersRepository as any,
      sessionsRepository as any,
    );

    clinicalOrdersRepository.findOne.mockResolvedValue({
      order_id: orderId,
      session_id: sessionId,
      status: 'ordered',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'in_progress',
      signed_at: null,
    });

    return {
      service,
      labTestResultsRepository,
      clinicalOrdersRepository,
      sessionsRepository,
    };
  }

  it('creates a lab test result for an existing mutable clinical order', async () => {
    const { service, labTestResultsRepository } = createService();

    const result = await service.create({
      order_id: orderId,
      test_name: 'CBC',
      result_value: 'Normal',
    });

    expect(result).toEqual(
      expect.objectContaining({
        order_id: orderId,
        test_name: 'CBC',
        result_value: 'Normal',
      }),
    );
    expect(labTestResultsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: orderId,
        test_name: 'CBC',
      }),
    );
  });

  it('rejects creating a result for a missing clinical order', async () => {
    const { service, labTestResultsRepository, clinicalOrdersRepository } =
      createService();
    clinicalOrdersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        order_id: orderId,
        test_name: 'CBC',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(labTestResultsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects creating a result for a finalized examination session', async () => {
    const { service, labTestResultsRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.create({
        order_id: orderId,
        test_name: 'CBC',
      }),
    ).rejects.toThrow(ConflictException);

    expect(labTestResultsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects changing result order context', async () => {
    const { service, labTestResultsRepository } = createService();
    labTestResultsRepository.findOne.mockResolvedValue({
      result_id: resultId,
      order_id: orderId,
      test_name: 'CBC',
    });

    await expect(
      service.update(resultId, {
        order_id: '44444444-4444-4444-8444-444444444444',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(labTestResultsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updating a result after its session is finalized', async () => {
    const { service, labTestResultsRepository, sessionsRepository } =
      createService();
    labTestResultsRepository.findOne.mockResolvedValue({
      result_id: resultId,
      order_id: orderId,
      test_name: 'CBC',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
      signed_at: new Date(),
    });

    await expect(
      service.update(resultId, {
        result_value: 'Changed after sign',
      }),
    ).rejects.toThrow(ConflictException);

    expect(labTestResultsRepository.save).not.toHaveBeenCalled();
  });

  it('updates result clinical fields while the session is mutable', async () => {
    const { service, labTestResultsRepository } = createService();
    labTestResultsRepository.findOne.mockResolvedValue({
      result_id: resultId,
      order_id: orderId,
      test_name: 'CBC',
      result_value: null,
    });

    const result = await service.update(resultId, {
      result_value: 'Normal',
      notes: 'Reviewed',
    });

    expect(result).toEqual(
      expect.objectContaining({
        order_id: orderId,
        test_name: 'CBC',
        result_value: 'Normal',
        notes: 'Reviewed',
      }),
    );
  });
});
