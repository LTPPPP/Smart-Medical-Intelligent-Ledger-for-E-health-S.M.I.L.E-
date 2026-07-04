import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientRepresentativesService } from './patient-representatives.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
    save: jest.fn((value) => Promise.resolve(value)),
  };
}

describe('PatientRepresentativesService', () => {
  const patientId = '33333333-3333-4333-8333-333333333333';
  const actorId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const representativesRepository = createRepositoryMock();
    const patientsService = {
      findByUserId: jest.fn<Promise<any>, [string]>(() =>
        Promise.resolve(null),
      ),
    };
    const service = new PatientRepresentativesService(
      representativesRepository as any,
      patientsService as any,
    );
    return { service, representativesRepository, patientsService };
  }

  it('should create an unverified legal representative with explicit consent scopes', async () => {
    const { service, representativesRepository } = createService();

    const result = await service.create(
      {
        patient_id: patientId,
        full_name: 'Tran Thi Guardian',
        relationship: 'mother',
        phone: '0900000000',
        legal_document_type: 'CCCD',
        legal_document_number: 'masked-local-demo',
        is_primary: true,
        authorized_for_treatment: true,
        authorized_for_payment: true,
        authorized_for_records: false,
      },
      actorId,
      'DOCTOR',
    );

    expect(representativesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        full_name: 'Tran Thi Guardian',
        relationship: 'mother',
        phone: '0900000000',
        is_primary: true,
        authorized_for_treatment: true,
        authorized_for_payment: true,
        authorized_for_records: false,
        verified_by: null,
        verified_at: null,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        full_name: 'Tran Thi Guardian',
        verified_by: null,
        verified_at: null,
      }),
    );
  });

  it('should demote other active primary representatives when creating a new primary', async () => {
    const { service, representativesRepository } = createService();

    await service.create(
      {
        patient_id: patientId,
        full_name: 'New Primary',
        relationship: 'father',
        phone: '0911111111',
        is_primary: true,
        authorized_for_treatment: true,
      },
      actorId,
      'DOCTOR',
    );

    expect(representativesRepository.update).toHaveBeenCalledWith(
      {
        patient_id: patientId,
        is_active: true,
        is_primary: true,
      },
      { is_primary: false },
    );
  });

  it('should resolve the primary representative authorized for treatment', async () => {
    const { service, representativesRepository } = createService();
    const representative = {
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Tran Thi Guardian',
      relationship: 'mother',
      phone: '0900000000',
      is_primary: true,
      authorized_for_treatment: true,
      verified_at: new Date('2026-07-04T10:00:00.000Z'),
    };
    representativesRepository.findOne.mockResolvedValue(representative);

    await expect(
      service.findAuthorizedRepresentative(patientId, 'treatment'),
    ).resolves.toBe(representative);

    expect(representativesRepository.findOne).toHaveBeenCalledWith({
      where: {
        patient_id: patientId,
        is_active: true,
        is_primary: true,
        authorized_for_treatment: true,
      },
      order: { verified_at: 'DESC', created_at: 'DESC' },
    });
  });

  it('should reject representative resolution when no authorized verified actor exists', async () => {
    const { service, representativesRepository } = createService();
    representativesRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findAuthorizedRepresentative(patientId, 'records'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject representatives without required identity and consent data', async () => {
    const { service, representativesRepository } = createService();

    await expect(
      service.create(
        {
          patient_id: patientId,
          full_name: '   ',
          relationship: 'mother',
          phone: '',
          authorized_for_treatment: false,
          authorized_for_payment: false,
          authorized_for_records: false,
        },
        actorId,
        'DOCTOR',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(representativesRepository.save).not.toHaveBeenCalled();
  });

  it('should update identity and authorization fields without self-verifying', async () => {
    const { service, representativesRepository } = createService();
    representativesRepository.findOne.mockResolvedValue({
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Old Guardian',
      relationship: 'mother',
      phone: '0900000000',
      email: null,
      authorized_for_treatment: true,
      authorized_for_payment: false,
      authorized_for_records: false,
      is_active: true,
    });

    const result = await service.update(
      '55555555-5555-4555-8555-555555555555',
      {
        full_name: 'Updated Guardian',
        phone: '0911111111',
        authorized_for_payment: true,
      },
      actorId,
      'DOCTOR',
    );

    expect(representativesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Updated Guardian',
        phone: '0911111111',
        authorized_for_treatment: true,
        authorized_for_payment: true,
      }),
    );
    expect(result.full_name).toBe('Updated Guardian');
  });

  it('should demote other active primaries when updating a representative to primary', async () => {
    const { service, representativesRepository } = createService();
    representativesRepository.findOne.mockResolvedValue({
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Guardian',
      relationship: 'mother',
      phone: '0900000000',
      authorized_for_treatment: true,
      authorized_for_payment: false,
      authorized_for_records: false,
      is_active: true,
      is_primary: false,
    });

    await service.update(
      '55555555-5555-4555-8555-555555555555',
      { is_primary: true },
      actorId,
      'DOCTOR',
    );

    expect(representativesRepository.update).toHaveBeenCalledWith(
      {
        patient_id: patientId,
        is_active: true,
        is_primary: true,
        representative_id: expect.any(Object),
      },
      { is_primary: false },
    );
  });

  it('should verify a representative through a dedicated clinical action', async () => {
    const { service, representativesRepository } = createService();
    representativesRepository.findOne.mockResolvedValue({
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Guardian',
      relationship: 'mother',
      phone: '0900000000',
      authorized_for_treatment: true,
      authorized_for_payment: false,
      authorized_for_records: false,
      is_active: true,
      verified_by: null,
      verified_at: null,
    });

    const result = await service.verify(
      '55555555-5555-4555-8555-555555555555',
      actorId,
      'DOCTOR',
    );

    expect(representativesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        verified_by: actorId,
        verified_at: expect.any(Date),
      }),
    );
    expect(result.verified_by).toBe(actorId);
  });

  it('should reject patient self-verification of a representative', async () => {
    const { service, representativesRepository, patientsService } =
      createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    representativesRepository.findOne.mockResolvedValue({
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Guardian',
      relationship: 'mother',
      phone: '0900000000',
      authorized_for_treatment: true,
      authorized_for_payment: false,
      authorized_for_records: false,
      is_active: true,
    });

    await expect(
      service.verify(
        '55555555-5555-4555-8555-555555555555',
        actorId,
        'PATIENT',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(representativesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject updates that remove all representative authorization scopes', async () => {
    const { service, representativesRepository } = createService();
    representativesRepository.findOne.mockResolvedValue({
      representative_id: '55555555-5555-4555-8555-555555555555',
      patient_id: patientId,
      full_name: 'Guardian',
      relationship: 'mother',
      phone: '0900000000',
      authorized_for_treatment: true,
      authorized_for_payment: false,
      authorized_for_records: false,
      is_active: true,
    });

    await expect(
      service.update(
        '55555555-5555-4555-8555-555555555555',
        {
          authorized_for_treatment: false,
        },
        actorId,
        'DOCTOR',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(representativesRepository.save).not.toHaveBeenCalled();
  });

  it('should allow the matching patient actor to read their representatives', async () => {
    const { service, representativesRepository, patientsService } =
      createService();
    patientsService.findByUserId.mockResolvedValue({ patient_id: patientId });
    representativesRepository.find.mockResolvedValue([]);

    await expect(
      service.findByPatient(patientId, actorId, 'PATIENT'),
    ).resolves.toEqual([]);

    expect(representativesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patient_id: patientId, is_active: true },
      }),
    );
  });

  it('should reject another patient actor from reading representatives', async () => {
    const { service, representativesRepository, patientsService } =
      createService();
    patientsService.findByUserId.mockResolvedValue({
      patient_id: '99999999-9999-4999-8999-999999999999',
    });

    await expect(
      service.findByPatient(patientId, actorId, 'PATIENT'),
    ).rejects.toThrow(ForbiddenException);

    expect(representativesRepository.find).not.toHaveBeenCalled();
  });

  it('should reject untrusted actors from representative access', async () => {
    const { service, representativesRepository } = createService();

    await expect(
      service.create(
        {
          patient_id: patientId,
          full_name: 'Tran Thi Guardian',
          relationship: 'mother',
          phone: '0900000000',
          authorized_for_treatment: true,
        },
        actorId,
        'GUEST',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(representativesRepository.save).not.toHaveBeenCalled();
  });
});
