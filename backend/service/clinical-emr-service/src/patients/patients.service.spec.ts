import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  const createService = () => {
    const patientsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };
    const appointmentsRepository = {
      find: jest.fn(),
    };
    return {
      service: new PatientsService(patientsRepository as any, appointmentsRepository as any),
      patientsRepository,
      appointmentsRepository,
    };
  };

  it('should resolve a user patient projection deterministically when duplicates exist', async () => {
    const { service, patientsRepository } = createService();
    patientsRepository.findOne.mockResolvedValue({ patient_id: 'patient-oldest' });

    const result = await service.findByUserId(
      '550e8400-e29b-41d4-a716-446655440004',
    );

    expect(result).toEqual({ patient_id: 'patient-oldest' });
    expect(patientsRepository.findOne).toHaveBeenCalledWith({
      where: { user_id: '550e8400-e29b-41d4-a716-446655440004' },
      order: { created_at: 'ASC' },
    });
  });

  it('should return only the linked patient profile for a patient actor', async () => {
    const { service, patientsRepository } = createService();
    patientsRepository.findOne.mockResolvedValue({ patient_id: 'patient-1' });

    await expect(service.findVisibleForActor('user-1', 'PATIENT')).resolves.toEqual([
      { patient_id: 'patient-1' },
    ]);
    expect(patientsRepository.find).not.toHaveBeenCalled();
  });

  it('should return only patients attached to a doctor appointment', async () => {
    const { service, patientsRepository, appointmentsRepository } = createService();
    appointmentsRepository.find.mockResolvedValue([
      { patient_id: 'patient-1' },
      { patient_id: 'patient-1' },
      { patient_id: 'patient-2' },
    ]);
    patientsRepository.find.mockResolvedValue([
      { patient_id: 'patient-1' },
      { patient_id: 'patient-2' },
    ]);

    const result = await service.findVisibleForActor('doctor-1', 'DOCTOR');

    expect(result).toEqual([
      { patient_id: 'patient-1' },
      { patient_id: 'patient-2' },
    ]);
    expect(appointmentsRepository.find).toHaveBeenCalledWith({
      select: { patient_id: true },
      where: { doctor_id: 'doctor-1' },
    });
    expect(patientsRepository.find).toHaveBeenCalledWith({
      where: { patient_id: expect.any(Object) },
    });
  });
});
