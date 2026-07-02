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
    save: jest.fn((value) => Promise.resolve(value)),
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

  it('should require a session when creating a treatment plan', async () => {
    const { service, treatmentPlansRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        created_by: doctorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating a treatment plan for a finalized session', async () => {
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

  it('should create a draft treatment plan linked to the session context', async () => {
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

  it('should reject creating a treatment plan with workflow status or consent metadata', async () => {
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

  it('should require an estimated cost before proposing a treatment plan', async () => {
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

  it('should require risk disclosure, alternatives, and quote version before proposing a treatment plan', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      estimated_cost: '1200000',
      risk_disclosure: '',
      alternative_options: null,
      quote_version: null,
    });

    await expect(service.propose(planId)).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('should propose a draft plan when quote data is present', async () => {
    const { service, treatmentPlansRepository } = createService();
    const plan = {
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      estimated_cost: '1200000',
      risk_disclosure: 'Pain, swelling, and treatment failure were discussed.',
      alternative_options: 'Extraction or observation were discussed.',
      quote_version: 'PRICE-2026-07',
      proposed_at: null,
    };
    treatmentPlansRepository.findOne.mockResolvedValue(plan);

    const result = await service.propose(planId);

    expect(result.status).toBe('proposed');
    expect(result.proposed_at).toBeInstanceOf(Date);
  });

  it('should record patient acceptance with actor and timestamp', async () => {
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

  it('should record partial acceptance with consent scope and note', async () => {
    const { service, treatmentPlansRepository } = createService();
    const plan = {
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      accepted_at: null,
      accepted_by: null,
      acceptance_scope: null,
      accepted_scope_note: null,
    };
    treatmentPlansRepository.findOne.mockResolvedValue(plan);

    const result = (await (service.accept as any)(planId, actorId, {
      acceptance_scope: 'partial',
      accepted_scope_note: 'Patient accepts phase 1 only.',
    })) as any;

    expect(result.status).toBe('partially_accepted');
    expect(result.accepted_at).toBeInstanceOf(Date);
    expect(result.accepted_by).toBe(actorId);
    expect(result.acceptance_scope).toBe('partial');
    expect(result.accepted_scope_note).toBe('Patient accepts phase 1 only.');
  });

  it('should reject partial acceptance without a scope note', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
    });

    await expect(
      (service.accept as any)(planId, actorId, { acceptance_scope: 'partial' }),
    ).rejects.toThrow(BadRequestException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('should record patient decline without requiring a sensitive reason', async () => {
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

  it('should reject moving into progress before acceptance', async () => {
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

  it('should reject direct status changes that bypass treatment plan workflow endpoints', async () => {
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

  it('should reject direct consent metadata changes outside accept or decline flow', async () => {
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

  it('should reject changing accepted treatment plan details after patient consent', async () => {
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

  it('should allow accepted treatment plans to move into progress without changing consented details', async () => {
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

  it('should allow partially accepted treatment plans to move into progress without changing consented details', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      record_id: recordId,
      created_by: doctorId,
      status: 'partially_accepted',
      estimated_cost: '1200000',
    });

    const result = await service.update(planId, { status: 'in_progress' });

    expect(result.status).toBe('in_progress');
    expect(treatmentPlansRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' }),
    );
  });

  it('should reject changing treatment plan session context after creation', async () => {
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

  it('should throw not found when the linked session is missing', async () => {
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
