import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  it('should resolve a user patient projection deterministically when duplicates exist', async () => {
    const patientsRepository = {
      findOne: jest.fn().mockResolvedValue({ patient_id: 'patient-oldest' }),
    };
    const service = new PatientsService(patientsRepository as any);

    const result = await service.findByUserId(
      '550e8400-e29b-41d4-a716-446655440004',
    );

    expect(result).toEqual({ patient_id: 'patient-oldest' });
    expect(patientsRepository.findOne).toHaveBeenCalledWith({
      where: { user_id: '550e8400-e29b-41d4-a716-446655440004' },
      order: { created_at: 'ASC' },
    });
  });
});
