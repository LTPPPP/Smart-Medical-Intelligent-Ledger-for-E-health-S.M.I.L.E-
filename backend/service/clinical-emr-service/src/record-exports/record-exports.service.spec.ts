import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RecordExportsService } from './record-exports.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('RecordExportsService', () => {
  const exportId = '11111111-1111-4111-8111-111111111111';
  const recordId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const recordExportsRepository = createRepositoryMock();
    const medicalRecordsRepository = createRepositoryMock();
    const service = new RecordExportsService(
      recordExportsRepository as any,
      medicalRecordsRepository as any,
    );
    return { service, recordExportsRepository, medicalRecordsRepository };
  }

  function finalizedRecord(overrides: Record<string, unknown> = {}) {
    return {
      record_id: recordId,
      patient_id: patientId,
      record_status: 'finalized',
      finalized_at: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  it('should create an export for a finalized medical record', async () => {
    const { service, recordExportsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue(finalizedRecord());

    const result = await service.create({
      patient_id: patientId,
      record_id: recordId,
      export_type: 'summary',
      export_format: 'pdf',
      exported_by: doctorId,
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        exported_by: doctorId,
      }),
    );
    expect(recordExportsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        exported_by: doctorId,
      }),
    );
  });

  it('should reject exporting a missing medical record', async () => {
    const { service, recordExportsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        patient_id: patientId,
        record_id: recordId,
        export_type: 'summary',
        export_format: 'pdf',
        exported_by: doctorId,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(recordExportsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject exporting when patient does not match the medical record', async () => {
    const { service, recordExportsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue(finalizedRecord());

    await expect(
      service.create({
        patient_id: '55555555-5555-4555-8555-555555555555',
        record_id: recordId,
        export_type: 'summary',
        export_format: 'pdf',
        exported_by: doctorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(recordExportsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject exporting a draft medical record', async () => {
    const { service, recordExportsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue(
      finalizedRecord({ record_status: 'draft', finalized_at: null }),
    );

    await expect(
      service.create({
        patient_id: patientId,
        record_id: recordId,
        export_type: 'summary',
        export_format: 'pdf',
        exported_by: doctorId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(recordExportsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing export patient, record, or exporter context', async () => {
    const { service, recordExportsRepository } = createService();
    recordExportsRepository.findOne.mockResolvedValue({
      export_id: exportId,
      patient_id: patientId,
      record_id: recordId,
      exported_by: doctorId,
    });

    await expect(
      service.update(exportId, {
        record_id: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(exportId, {
        patient_id: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(exportId, {
        exported_by: '88888888-8888-4888-8888-888888888888',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(recordExportsRepository.save).not.toHaveBeenCalled();
  });

  it('should update export metadata', async () => {
    const { service, recordExportsRepository } = createService();
    recordExportsRepository.findOne.mockResolvedValue({
      export_id: exportId,
      patient_id: patientId,
      record_id: recordId,
      exported_by: doctorId,
      file_url: null,
    });

    const result = await service.update(exportId, {
      file_url: 'https://example.test/export.pdf',
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        exported_by: doctorId,
        file_url: 'https://example.test/export.pdf',
      }),
    );
  });
});
