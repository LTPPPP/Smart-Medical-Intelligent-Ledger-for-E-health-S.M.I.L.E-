import { BadRequestException, ConflictException } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('MedicalRecordsService', () => {
  const recordId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';
  const doctorId = '33333333-3333-4333-8333-333333333333';
  const clinicId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const recordsRepository = createRepositoryMock();
    const versionsRepository = createRepositoryMock();
    const service = new MedicalRecordsService(
      recordsRepository as any,
      versionsRepository as any,
    );

    recordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      visit_date: '2026-07-02',
      chief_complaint: 'Tooth pain',
      diagnosis: 'Pulpitis',
      treatment_plan: 'Root canal',
      notes: 'Initial record',
      record_status: 'draft',
      finalized_at: null,
      finalized_by: null,
    });
    versionsRepository.findOne.mockResolvedValue(null);

    return { service, recordsRepository, versionsRepository };
  }

  it('creates medical records as draft records', async () => {
    const { service, recordsRepository } = createService();

    await service.create({
      patient_id: patientId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      visit_date: '2026-07-02',
      chief_complaint: 'Tooth pain',
    });

    expect(recordsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        clinic_id: clinicId,
        doctor_id: doctorId,
        record_status: 'draft',
      }),
    );
  });

  it('rejects creating medical records with a non-draft status', async () => {
    const { service, recordsRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        clinic_id: clinicId,
        doctor_id: doctorId,
        visit_date: '2026-07-02',
        record_status: 'finalized',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(recordsRepository.save).not.toHaveBeenCalled();
  });

  it('updates draft medical record clinical fields', async () => {
    const { service } = createService();

    const result = await service.update(recordId, {
      diagnosis: 'Reversible pulpitis',
      treatment_plan: 'Filling',
      notes: 'Follow up in 2 weeks',
    });

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis: 'Reversible pulpitis',
        treatment_plan: 'Filling',
        notes: 'Follow up in 2 weeks',
      }),
    );
  });

  it('rejects changing medical record visit context fields', async () => {
    const { service, recordsRepository } = createService();

    await expect(
      service.update(recordId, {
        patient_id: '55555555-5555-4555-8555-555555555555',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(recordId, {
        doctor_id: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(recordId, {
        appointment_id: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(recordId, { visit_date: '2026-07-03' }),
    ).rejects.toThrow(BadRequestException);

    expect(recordsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects changing medical record signing fields through update', async () => {
    const { service, recordsRepository } = createService();

    await expect(
      service.update(recordId, { record_status: 'finalized' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(recordId, {
        finalized_by: doctorId,
        finalized_at: new Date('2026-07-02T00:00:00.000Z'),
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(recordsRepository.save).not.toHaveBeenCalled();
  });

  it('finalizes a draft record and stores a version snapshot', async () => {
    const { service, recordsRepository, versionsRepository } = createService();

    const result = await service.finalize(recordId);

    expect(result.record_status).toBe('finalized');
    expect(result.finalized_at).toBeInstanceOf(Date);
    expect(result.finalized_by).toBe(doctorId);
    expect(versionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        record_id: recordId,
        version_number: 1,
        changed_by: doctorId,
        change_reason: 'Medical record finalized',
        snapshot: expect.objectContaining({
          record_id: recordId,
          record_status: 'finalized',
        }),
      }),
    );
    expect(recordsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ record_status: 'finalized' }),
    );
  });

  it('rejects finalizing an already finalized record', async () => {
    const { service, recordsRepository, versionsRepository } = createService();
    recordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      doctor_id: doctorId,
      record_status: 'finalized',
      finalized_at: new Date(),
      finalized_by: doctorId,
    });

    await expect(service.finalize(recordId)).rejects.toThrow(ConflictException);
    expect(versionsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updating a finalized record', async () => {
    const { service, recordsRepository } = createService();
    recordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(
      service.update(recordId, { notes: 'Overwrite after signing' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects deleting a finalized record', async () => {
    const { service, recordsRepository } = createService();
    recordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(service.remove(recordId)).rejects.toThrow(ConflictException);
    expect(recordsRepository.remove).not.toHaveBeenCalled();
  });

  it('increments version numbers for record snapshots', async () => {
    const { service, versionsRepository } = createService();
    versionsRepository.findOne.mockResolvedValue({ version_number: 3 });

    await service.createVersion(recordId, { record_id: recordId }, doctorId);

    expect(versionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ version_number: 4 }),
    );
  });
});
