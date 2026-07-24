import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TreatmentHistoryService } from './treatment-history.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };
}

describe('TreatmentHistoryService', () => {
  const treatmentId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';
  const recordId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const treatmentHistoryRepository = createRepositoryMock();
    const medicalRecordsRepository = createRepositoryMock();
    const service = new TreatmentHistoryService(
      treatmentHistoryRepository as any,
      medicalRecordsRepository as any,
    );

    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'draft',
      finalized_at: null,
    });

    return {
      service,
      treatmentHistoryRepository,
      medicalRecordsRepository,
    };
  }

  function createTreatment(overrides = {}) {
    return {
      record_id: recordId,
      patient_id: patientId,
      treatment_date: '2026-07-02',
      procedure_name: 'Scaling',
      performed_by: doctorId,
      ...overrides,
    };
  }

  it('should reject creating treatment history when patient does not match the record', async () => {
    const { service, treatmentHistoryRepository } = createService();

    await expect(
      service.create(
        createTreatment({
          patient_id: '55555555-5555-4555-8555-555555555555',
        }),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentHistoryRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating treatment history for a finalized record', async () => {
    const { service, treatmentHistoryRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(service.create(createTreatment())).rejects.toThrow(
      ConflictException,
    );

    expect(treatmentHistoryRepository.save).not.toHaveBeenCalled();
  });

  it('should create treatment history linked to a mutable medical record', async () => {
    const { service, treatmentHistoryRepository } = createService();

    const result = await service.create(createTreatment());

    expect(result).toEqual(
      expect.objectContaining({
        record_id: recordId,
        patient_id: patientId,
        procedure_name: 'Scaling',
        performed_by: doctorId,
      }),
    );
    expect(treatmentHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        record_id: recordId,
        patient_id: patientId,
      }),
    );
  });

  it('should reject updating treatment history after its record is finalized', async () => {
    const { service, treatmentHistoryRepository, medicalRecordsRepository } =
      createService();
    treatmentHistoryRepository.findOne.mockResolvedValue({
      treatment_id: treatmentId,
      ...createTreatment(),
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'signed',
      finalized_at: new Date(),
    });

    await expect(
      service.update(treatmentId, { procedure_name: 'Updated procedure' }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentHistoryRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing treatment history patient, record, or performer context', async () => {
    const { service, treatmentHistoryRepository } = createService();
    treatmentHistoryRepository.findOne.mockResolvedValue({
      treatment_id: treatmentId,
      ...createTreatment(),
    });

    await expect(
      service.update(treatmentId, {
        performed_by: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentHistoryRepository.save).not.toHaveBeenCalled();
  });

  it('should reject deleting treatment history after its record is finalized', async () => {
    const { service, treatmentHistoryRepository, medicalRecordsRepository } =
      createService();
    treatmentHistoryRepository.findOne.mockResolvedValue({
      treatment_id: treatmentId,
      ...createTreatment(),
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'completed',
      finalized_at: new Date(),
    });

    await expect(service.remove(treatmentId)).rejects.toThrow(
      ConflictException,
    );

    expect(treatmentHistoryRepository.remove).not.toHaveBeenCalled();
  });

  it('should throw not found when the linked record is missing', async () => {
    const { service, medicalRecordsRepository } = createService();
    medicalRecordsRepository.findOne.mockResolvedValue(null);

    await expect(service.create(createTreatment())).rejects.toThrow(
      NotFoundException,
    );
  });
});
