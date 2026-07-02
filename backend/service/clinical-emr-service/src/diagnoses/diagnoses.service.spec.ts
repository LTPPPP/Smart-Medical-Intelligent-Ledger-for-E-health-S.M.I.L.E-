import { ConflictException } from '@nestjs/common';
import { DiagnosesService } from './diagnoses.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('DiagnosesService', () => {
  const diagnosisId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const diagnosesRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new DiagnosesService(
      diagnosesRepository as any,
      sessionsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'in_progress',
    });

    return { service, diagnosesRepository, sessionsRepository };
  }

  it('rejects creating a diagnosis for a finalized session', async () => {
    const { service, diagnosesRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
    });

    await expect(
      service.create({
        session_id: sessionId,
        diagnosis_name: 'Pulpitis',
      }),
    ).rejects.toThrow(ConflictException);

    expect(diagnosesRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updating a diagnosis after its session is finalized', async () => {
    const { service, diagnosesRepository, sessionsRepository } =
      createService();
    diagnosesRepository.findOne.mockResolvedValue({
      diagnosis_id: diagnosisId,
      session_id: sessionId,
      diagnosis_name: 'Pulpitis',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'completed',
    });

    await expect(
      service.update(diagnosisId, { diagnosis_name: 'Updated diagnosis' }),
    ).rejects.toThrow(ConflictException);

    expect(diagnosesRepository.save).not.toHaveBeenCalled();
  });
});
