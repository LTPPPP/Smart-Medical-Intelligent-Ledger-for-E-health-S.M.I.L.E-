import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('MedicalHistoryService', () => {
  const historyId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const repository = createRepositoryMock();
    const service = new MedicalHistoryService(repository as any);
    return { service, repository };
  }

  it('creates medical history for a patient', async () => {
    const { service, repository } = createService();

    const result = await service.create({
      patient_id: patientId,
      condition_name: 'Diabetes',
      condition_type: 'chronic',
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        condition_name: 'Diabetes',
      }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        condition_name: 'Diabetes',
      }),
    );
  });

  it('rejects changing medical history patient context', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      history_id: historyId,
      patient_id: patientId,
      condition_name: 'Diabetes',
    });

    await expect(
      service.update(historyId, {
        patient_id: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates medical history clinical fields', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      history_id: historyId,
      patient_id: patientId,
      condition_name: 'Diabetes',
    });

    const result = await service.update(historyId, {
      notes: 'Controlled',
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        notes: 'Controlled',
      }),
    );
  });

  it('throws not found when medical history is missing', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(historyId)).rejects.toThrow(NotFoundException);
  });
});
