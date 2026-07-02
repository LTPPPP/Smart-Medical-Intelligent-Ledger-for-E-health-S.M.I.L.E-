import { ConflictException } from '@nestjs/common';
import { SymptomsService } from './symptoms.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('SymptomsService', () => {
  const symptomId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const recordedBy = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const symptomsRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new SymptomsService(
      symptomsRepository as any,
      sessionsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'in_progress',
    });

    return { service, symptomsRepository, sessionsRepository };
  }

  it('rejects creating a symptom for a finalized session', async () => {
    const { service, symptomsRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
    });

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        symptom_name: 'Pain',
        recorded_by: recordedBy,
      }),
    ).rejects.toThrow(ConflictException);

    expect(symptomsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updating a symptom after its session is finalized', async () => {
    const { service, symptomsRepository, sessionsRepository } =
      createService();
    symptomsRepository.findOne.mockResolvedValue({
      symptom_id: symptomId,
      session_id: sessionId,
      symptom_name: 'Pain',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
    });

    await expect(
      service.update(symptomId, { symptom_name: 'Updated pain' }),
    ).rejects.toThrow(ConflictException);

    expect(symptomsRepository.save).not.toHaveBeenCalled();
  });
});
