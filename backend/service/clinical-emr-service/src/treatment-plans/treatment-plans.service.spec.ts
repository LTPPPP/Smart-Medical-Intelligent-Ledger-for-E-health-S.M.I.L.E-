import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TreatmentPlansService } from './treatment-plans.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    remove: jest.fn(),
  };
}

describe('TreatmentPlansService', () => {
  const planId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';
  const recordId = '55555555-5555-4555-8555-555555555555';
  const actorId = '66666666-6666-4666-8666-666666666666';

  function createService() {
    const treatmentPlansRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const service = new TreatmentPlansService(
      treatmentPlansRepository as any,
      sessionsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'in_progress',
    });

    return { service, treatmentPlansRepository, sessionsRepository };
  }

  it('requires a session when creating a treatment plan', async () => {
    const { service, treatmentPlansRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        created_by: doctorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('rejects creating a treatment plan for a finalized session', async () => {
    const { service, treatmentPlansRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'completed',
    });

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        created_by: doctorId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('creates a draft treatment plan linked to the session context', async () => {
    const { service, treatmentPlansRepository } = createService();

    const result = await service.create({
      session_id: sessionId,
      patient_id: patientId,
      created_by: doctorId,
      plan_name: 'Root canal plan',
    });

    expect(result).toEqual(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        record_id: recordId,
        created_by: doctorId,
        status: 'draft',
      }),
    );
    expect(treatmentPlansRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        record_id: recordId,
        status: 'draft',
      }),
    );
  });

  it('rejects creating a treatment plan with workflow status or consent metadata', async () => {
    const { service, treatmentPlansRepository } = createService();

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        created_by: doctorId,
        status: 'accepted',
        accepted_by: actorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('requires an estimated cost before proposing a treatment plan', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      estimated_cost: null,
    });

    await expect(service.propose(planId)).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('proposes a draft plan when quote data is present', async () => {
    const { service, treatmentPlansRepository } = createService();
    const plan = {
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      estimated_cost: '1200000',
      proposed_at: null,
    };
    treatmentPlansRepository.findOne.mockResolvedValue(plan);

    const result = await service.propose(planId);

    expect(result.status).toBe('proposed');
    expect(result.proposed_at).toBeInstanceOf(Date);
  });

  it('records patient acceptance with actor and timestamp', async () => {
    const { service, treatmentPlansRepository } = createService();
    const plan = {
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      accepted_at: null,
      accepted_by: null,
    };
    treatmentPlansRepository.findOne.mockResolvedValue(plan);

    const result = await service.accept(planId, actorId);

    expect(result.status).toBe('accepted');
    expect(result.accepted_at).toBeInstanceOf(Date);
    expect(result.accepted_by).toBe(actorId);
  });

  it('records patient decline without requiring a sensitive reason', async () => {
    const { service, treatmentPlansRepository } = createService();
    const plan = {
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      declined_at: null,
      declined_by: null,
      decline_reason: null,
    };
    treatmentPlansRepository.findOne.mockResolvedValue(plan);

    const result = await service.decline(planId, actorId, '');

    expect(result.status).toBe('declined');
    expect(result.declined_at).toBeInstanceOf(Date);
    expect(result.declined_by).toBe(actorId);
    expect(result.decline_reason).toBeNull();
  });

  it('rejects moving into progress before acceptance', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
    });

    await expect(
      service.update(planId, { status: 'in_progress' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects direct status changes that bypass treatment plan workflow endpoints', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'proposed',
    });

    await expect(
      service.update(planId, {
        status: 'accepted',
      }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('rejects direct consent metadata changes outside accept or decline flow', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'proposed',
      accepted_by: null,
    });

    await expect(
      service.update(planId, {
        accepted_by: actorId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('rejects changing accepted treatment plan details after patient consent', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'accepted',
      estimated_cost: '1200000',
    });

    await expect(
      service.update(planId, {
        estimated_cost: '1500000',
      }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('allows accepted treatment plans to move into progress without changing consented details', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'accepted',
      estimated_cost: '1200000',
    });

    const result = await service.update(planId, { status: 'in_progress' });

    expect(result.status).toBe('in_progress');
    expect(treatmentPlansRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' }),
    );
  });

  it('rejects changing treatment plan session context after creation', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'draft',
    });

    await expect(
      service.update(planId, {
        patient_id: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws not found when the linked session is missing', async () => {
    const { service, sessionsRepository } = createService();
    sessionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        created_by: doctorId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
