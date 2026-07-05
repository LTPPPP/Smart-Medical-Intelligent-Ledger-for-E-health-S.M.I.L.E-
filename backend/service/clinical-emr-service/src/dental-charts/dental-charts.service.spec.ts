import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DentalChartsService } from './dental-charts.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('DentalChartsService', () => {
  const chartId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';
  const recordId = '33333333-3333-4333-8333-333333333333';

  function createService() {
    const dentalChartsRepository = createRepositoryMock();
    const medicalRecordsRepository = createRepositoryMock();
    const service = new DentalChartsService(
      dentalChartsRepository as any,
      medicalRecordsRepository as any,
    );

    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'draft',
      finalized_at: null,
    });

    return { service, dentalChartsRepository, medicalRecordsRepository };
  }

  it('should require a record when creating a dental chart', async () => {
    const { service, dentalChartsRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        tooth_number: 11,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating a dental chart when patient does not match the record', async () => {
    const { service, dentalChartsRepository } = createService();

    await expect(
      service.create({
        patient_id: '44444444-4444-4444-8444-444444444444',
        record_id: recordId,
        tooth_number: 11,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating a dental chart for a finalized record', async () => {
    const { service, dentalChartsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(
      service.create({
        patient_id: patientId,
        record_id: recordId,
        tooth_number: 11,
      }),
    ).rejects.toThrow(ConflictException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject invalid FDI tooth numbers', async () => {
    const { service, dentalChartsRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        record_id: recordId,
        tooth_number: 55,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should create a dental chart linked to a mutable medical record', async () => {
    const { service, dentalChartsRepository } = createService();

    const result = await service.create({
      patient_id: patientId,
      record_id: recordId,
      tooth_number: 11,
      tooth_status: 'caries',
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        tooth_number: 11,
        tooth_status: 'caries',
      }),
    );
    expect(dentalChartsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        tooth_number: 11,
      }),
    );
  });

  it('should reject updating a dental chart after its record is finalized', async () => {
    const { service, dentalChartsRepository, medicalRecordsRepository } =
      createService();
    dentalChartsRepository.findOne.mockResolvedValue({
      chart_id: chartId,
      patient_id: patientId,
      record_id: recordId,
      tooth_number: 11,
      tooth_status: 'caries',
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'signed',
      finalized_at: new Date(),
    });

    await expect(
      service.update(chartId, { tooth_status: 'filled' }),
    ).rejects.toThrow(ConflictException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing dental chart patient, record, or tooth context', async () => {
    const { service, dentalChartsRepository } = createService();
    dentalChartsRepository.findOne.mockResolvedValue({
      chart_id: chartId,
      patient_id: patientId,
      record_id: recordId,
      tooth_number: 11,
      tooth_status: 'caries',
    });

    await expect(
      service.update(chartId, {
        patient_id: '44444444-4444-4444-8444-444444444444',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dentalChartsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject deleting a dental chart after its record is finalized', async () => {
    const { service, dentalChartsRepository, medicalRecordsRepository } =
      createService();
    dentalChartsRepository.findOne.mockResolvedValue({
      chart_id: chartId,
      patient_id: patientId,
      record_id: recordId,
      tooth_number: 11,
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'completed',
      finalized_at: new Date(),
    });

    await expect(service.remove(chartId)).rejects.toThrow(ConflictException);

    expect(dentalChartsRepository.remove).not.toHaveBeenCalled();
  });

  it('should throw not found when the linked record is missing', async () => {
    const { service, medicalRecordsRepository } = createService();
    medicalRecordsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        patient_id: patientId,
        record_id: recordId,
        tooth_number: 11,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
