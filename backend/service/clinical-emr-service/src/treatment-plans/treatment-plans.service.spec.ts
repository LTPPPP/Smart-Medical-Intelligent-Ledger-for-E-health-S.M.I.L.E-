import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TreatmentPlansService } from './treatment-plans.service';
import { PlanStatus } from '../utils/enums/plan-status.enum';

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
    const patientRepresentativesService = {
      findAuthorizedRepresentative: jest.fn(),
    };
    const service = new TreatmentPlansService(
      treatmentPlansRepository as any,
      sessionsRepository as any,
      patientRepresentativesService as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: PlanStatus.IN_PROGRESS,
    });

    return {
      service,
      treatmentPlansRepository,
      sessionsRepository,
      patientRepresentativesService,
    };
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

  it('should list treatment plans by exact examination session', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.find.mockResolvedValue([
      {
        plan_id: planId,
        session_id: sessionId,
        patient_id: patientId,
      },
    ]);

    const result = await service.findBySessionId(sessionId);

    expect(result).toEqual([
      expect.objectContaining({
        plan_id: planId,
        session_id: sessionId,
      }),
    ]);
    expect(treatmentPlansRepository.find).toHaveBeenCalledWith({
      where: { session_id: sessionId },
      order: { created_at: 'DESC' },
    });
  });

  it('should load patient context when resolving a treatment plan', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
    });

    await service.findOne(planId);

    expect(treatmentPlansRepository.findOne).toHaveBeenCalledWith({
      where: { plan_id: planId },
      relations: ['session', 'patient'],
    });
  });

  it('should reject creating a treatment plan with workflow status or consent metadata', async () => {
    const { service, treatmentPlansRepository } = createService();

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        created_by: doctorId,
        status: PlanStatus.ACCEPTED,
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

  it('should reject proposing a treatment plan after the linked encounter is finalized', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      estimated_cost: '1200000',
      risk_disclosure: 'Pain, swelling, and treatment failure were discussed.',
      alternative_options: 'Extraction or observation were discussed.',
      quote_version: 'PRICE-2026-07',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });

    await expect(service.propose(planId)).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
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

  it('should require a verified legal representative before a minor patient accepts a treatment plan', async () => {
    const { service, treatmentPlansRepository, patientRepresentativesService } =
      createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      accepted_at: null,
      accepted_by: null,
      patient: {
        date_of_birth: new Date('2015-01-01'),
      },
    });
    patientRepresentativesService.findAuthorizedRepresentative.mockRejectedValue(
      new NotFoundException('No representative'),
    );

    await expect(service.accept(planId, actorId)).rejects.toThrow(
      NotFoundException,
    );

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('should snapshot the legal representative when a minor treatment plan is accepted', async () => {
    const { service, treatmentPlansRepository, patientRepresentativesService } =
      createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      patient_id: patientId,
      status: 'proposed',
      accepted_at: null,
      accepted_by: null,
      patient: {
        date_of_birth: new Date('2015-01-01'),
      },
    });
    patientRepresentativesService.findAuthorizedRepresentative.mockResolvedValue(
      {
        representative_id: '77777777-7777-4777-8777-777777777777',
        full_name: 'Tran Thi Guardian',
        relationship: 'mother',
        phone: '0900000000',
      },
    );

    const result = await service.accept(planId, actorId);

    expect(
      patientRepresentativesService.findAuthorizedRepresentative,
    ).toHaveBeenCalledWith(patientId, 'treatment');
    expect(result).toEqual(
      expect.objectContaining({
        status: PlanStatus.ACCEPTED,
        accepted_representative_id: '77777777-7777-4777-8777-777777777777',
        accepted_representative_name: 'Tran Thi Guardian',
        accepted_representative_relationship: 'mother',
        accepted_representative_phone: '0900000000',
      }),
    );
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

  it('should reject accepting a treatment plan after the linked encounter is finalized', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      session: {
        status: 'signed',
        signed_at: new Date(),
      },
    });

    await expect(service.accept(planId, actorId)).rejects.toThrow(
      ConflictException,
    );

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
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

  it('should reject declining a treatment plan after the linked encounter is finalized', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });

    await expect(service.decline(planId, actorId, '')).rejects.toThrow(
      ConflictException,
    );

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
  });

  it('should reject moving into progress before acceptance', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'proposed',
    });

    await expect(
      service.update(planId, { status: PlanStatus.IN_PROGRESS }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject updating a treatment plan after the linked encounter is finalized', async () => {
    const { service, treatmentPlansRepository } = createService();
    treatmentPlansRepository.findOne.mockResolvedValue({
      plan_id: planId,
      session_id: sessionId,
      status: 'draft',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });

    await expect(
      service.update(planId, { plan_name: 'Updated plan' }),
    ).rejects.toThrow(ConflictException);

    expect(treatmentPlansRepository.save).not.toHaveBeenCalled();
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
        status: PlanStatus.ACCEPTED,
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
      status: PlanStatus.ACCEPTED,
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
      status: PlanStatus.ACCEPTED,
      estimated_cost: '1200000',
    });

    const result = await service.update(planId, {
      status: PlanStatus.IN_PROGRESS,
    });

    expect(result.status).toBe('in_progress');
    expect(treatmentPlansRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PlanStatus.IN_PROGRESS }),
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

    const result = await service.update(planId, {
      status: PlanStatus.IN_PROGRESS,
    });

    expect(result.status).toBe('in_progress');
    expect(treatmentPlansRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PlanStatus.IN_PROGRESS }),
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
