import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SymptomsService } from './symptoms.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
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

  it('should reject creating a symptom for a finalized session', async () => {
    const { service, symptomsRepository, sessionsRepository } = createService();
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

  it('should reject updating a symptom after its session is finalized', async () => {
    const { service, symptomsRepository, sessionsRepository } = createService();
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

  it('should reject updating a symptom after its session is signed', async () => {
    const { service, symptomsRepository, sessionsRepository } = createService();
    symptomsRepository.findOne.mockResolvedValue({
      symptom_id: symptomId,
      session_id: sessionId,
      symptom_name: 'Pain',
    });
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      status: 'in_progress',
      signed_at: new Date(),
    });

    await expect(
      service.update(symptomId, { symptom_name: 'Updated pain' }),
    ).rejects.toThrow(ConflictException);

    expect(symptomsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject moving a symptom to another encounter context after creation', async () => {
    const { service, symptomsRepository } = createService();
    symptomsRepository.findOne.mockResolvedValue({
      symptom_id: symptomId,
      session_id: sessionId,
      patient_id: patientId,
      recorded_by: recordedBy,
      symptom_name: 'Pain',
    });

    await expect(
      service.update(symptomId, {
        session_id: '55555555-5555-4555-8555-555555555555',
        patient_id: '66666666-6666-4666-8666-666666666666',
        recorded_by: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(symptomsRepository.save).not.toHaveBeenCalled();
  });

  describe('create (Enter Symptoms)', () => {
    it('should create a symptom for an open session', async () => {
      const { service, symptomsRepository } = createService();

      const result = await service.create({
        session_id: sessionId,
        patient_id: patientId,
        symptom_name: 'Toothache',
        recorded_by: recordedBy,
      });

      expect(result).toEqual(
        expect.objectContaining({
          session_id: sessionId,
          patient_id: patientId,
          symptom_name: 'Toothache',
        }),
      );
      expect(symptomsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll / findOne / findBySessionId / findByPatientId (View Symptoms)', () => {
    it('should list all symptoms', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.find.mockResolvedValue([{ symptom_id: symptomId }]);

      const result = await service.findAll();

      expect(result).toEqual([{ symptom_id: symptomId }]);
    });

    it('should return a symptom by id', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.findOne.mockResolvedValue({ symptom_id: symptomId });

      const result = await service.findOne(symptomId);

      expect(symptomsRepository.findOne).toHaveBeenCalledWith({
        where: { symptom_id: symptomId },
      });
      expect(result).toEqual({ symptom_id: symptomId });
    });

    it('should throw NotFoundException when the symptom does not exist', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(symptomId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should list symptoms recorded in a session', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.find.mockResolvedValue([{ symptom_id: symptomId }]);

      const result = await service.findBySessionId(sessionId);

      expect(symptomsRepository.find).toHaveBeenCalledWith({
        where: { session_id: sessionId },
      });
      expect(result).toEqual([{ symptom_id: symptomId }]);
    });

    it("should list a patient's symptoms across sessions", async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.find.mockResolvedValue([{ symptom_id: symptomId }]);

      const result = await service.findByPatientId(patientId);

      expect(symptomsRepository.find).toHaveBeenCalledWith({
        where: { patient_id: patientId },
      });
      expect(result).toEqual([{ symptom_id: symptomId }]);
    });
  });

  describe('update (Edit Symptoms)', () => {
    it('should update a symptom on an open session', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.findOne.mockResolvedValue({
        symptom_id: symptomId,
        session_id: sessionId,
        symptom_name: 'Pain',
      });

      const result = await service.update(symptomId, {
        symptom_name: 'Sharp pain',
      });

      expect(result).toEqual(
        expect.objectContaining({
          symptom_id: symptomId,
          symptom_name: 'Sharp pain',
        }),
      );
      expect(symptomsRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove (Delete Symptoms)', () => {
    it('should delete a symptom on an open session', async () => {
      const { service, symptomsRepository } = createService();
      const symptom = { symptom_id: symptomId, session_id: sessionId };
      symptomsRepository.findOne.mockResolvedValue(symptom);

      await service.remove(symptomId);

      expect(symptomsRepository.remove).toHaveBeenCalledWith(symptom);
    });

    it('should reject deleting a symptom after its session is finalized', async () => {
      const { service, symptomsRepository, sessionsRepository } =
        createService();
      symptomsRepository.findOne.mockResolvedValue({
        symptom_id: symptomId,
        session_id: sessionId,
      });
      sessionsRepository.findOne.mockResolvedValue({
        session_id: sessionId,
        status: 'completed',
      });

      await expect(service.remove(symptomId)).rejects.toThrow(
        ConflictException,
      );
      expect(symptomsRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing a missing symptom', async () => {
      const { service, symptomsRepository } = createService();
      symptomsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(symptomId)).rejects.toThrow(
        NotFoundException,
      );
      expect(symptomsRepository.remove).not.toHaveBeenCalled();
    });
  });
});
