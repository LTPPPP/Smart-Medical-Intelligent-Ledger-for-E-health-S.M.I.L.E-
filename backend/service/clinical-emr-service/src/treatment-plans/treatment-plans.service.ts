import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentPlanEntity } from './entities/treatment-plan.entity';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class TreatmentPlansService {
  constructor(
    @InjectRepository(TreatmentPlanEntity)
    private treatmentPlansRepository: Repository<TreatmentPlanEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private sessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(
    createTreatmentPlanDto: CreateTreatmentPlanDto,
  ): Promise<TreatmentPlanEntity> {
    if (!createTreatmentPlanDto.session_id) {
      throw new BadRequestException('session_id is required');
    }

    const session = await this.sessionsRepository.findOne({
      where: { session_id: createTreatmentPlanDto.session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${createTreatmentPlanDto.session_id} not found`,
      );
    }
    this.assertSessionMutable(session);

    if (
      createTreatmentPlanDto.patient_id &&
      session.patient_id &&
      createTreatmentPlanDto.patient_id !== session.patient_id
    ) {
      throw new BadRequestException('Treatment plan patient does not match session');
    }
    if (
      createTreatmentPlanDto.created_by &&
      session.doctor_id &&
      createTreatmentPlanDto.created_by !== session.doctor_id
    ) {
      throw new BadRequestException('Treatment plan doctor does not match session');
    }
    if (
      createTreatmentPlanDto.record_id &&
      session.record_id &&
      createTreatmentPlanDto.record_id !== session.record_id
    ) {
      throw new BadRequestException('Treatment plan record does not match session');
    }

    const treatmentPlan = this.treatmentPlansRepository.create({
      ...createTreatmentPlanDto,
      session_id: session.session_id,
      patient_id: session.patient_id ?? createTreatmentPlanDto.patient_id,
      record_id: session.record_id ?? createTreatmentPlanDto.record_id ?? null,
      created_by: session.doctor_id ?? createTreatmentPlanDto.created_by,
      status: 'draft',
      estimated_cost: this.normalizeEstimatedCost(
        createTreatmentPlanDto.estimated_cost,
      ),
      quote_currency: createTreatmentPlanDto.quote_currency ?? 'VND',
    });
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async findAll(): Promise<TreatmentPlanEntity[]> {
    return this.treatmentPlansRepository.find();
  }

  async findOne(plan_id: string): Promise<TreatmentPlanEntity> {
    const treatmentPlan = await this.treatmentPlansRepository.findOne({
      where: { plan_id },
    });
    if (!treatmentPlan) {
      throw new NotFoundException(
        `Treatment plan with ID ${plan_id} not found`,
      );
    }
    return treatmentPlan;
  }

  async findByPatientId(patient_id: string): Promise<TreatmentPlanEntity[]> {
    return this.treatmentPlansRepository.find({
      where: { patient_id },
    });
  }

  async findByRecordId(record_id: string): Promise<TreatmentPlanEntity[]> {
    return this.treatmentPlansRepository.find({
      where: { record_id },
    });
  }

  async update(
    plan_id: string,
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ): Promise<TreatmentPlanEntity> {
    const treatmentPlan = await this.findOne(plan_id);
    this.assertPlanUpdatable(treatmentPlan);
    this.assertContextUnchanged(treatmentPlan, updateTreatmentPlanDto);
    if (
      updateTreatmentPlanDto.status === 'in_progress' &&
      treatmentPlan.status !== 'accepted'
    ) {
      throw new ConflictException('Treatment plan must be accepted before progress');
    }

    Object.assign(treatmentPlan, updateTreatmentPlanDto);
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async propose(plan_id: string): Promise<TreatmentPlanEntity> {
    const treatmentPlan = await this.findOne(plan_id);
    this.assertPlanEditable(treatmentPlan);
    if (treatmentPlan.status !== 'draft') {
      throw new ConflictException('Only draft treatment plans can be proposed');
    }
    if (!this.hasPositiveEstimatedCost(treatmentPlan.estimated_cost)) {
      throw new BadRequestException(
        'estimated_cost is required before proposing treatment plan',
      );
    }

    treatmentPlan.status = 'proposed';
    treatmentPlan.proposed_at = new Date();
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async accept(
    plan_id: string,
    accepted_by: string,
  ): Promise<TreatmentPlanEntity> {
    if (!accepted_by?.trim()) {
      throw new BadRequestException('accepted_by is required');
    }

    const treatmentPlan = await this.findOne(plan_id);
    if (treatmentPlan.status !== 'proposed') {
      throw new ConflictException('Only proposed treatment plans can be accepted');
    }

    treatmentPlan.status = 'accepted';
    treatmentPlan.accepted_at = new Date();
    treatmentPlan.accepted_by = accepted_by;
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async decline(
    plan_id: string,
    declined_by: string,
    reason?: string,
  ): Promise<TreatmentPlanEntity> {
    if (!declined_by?.trim()) {
      throw new BadRequestException('declined_by is required');
    }

    const treatmentPlan = await this.findOne(plan_id);
    if (treatmentPlan.status !== 'proposed') {
      throw new ConflictException('Only proposed treatment plans can be declined');
    }

    treatmentPlan.status = 'declined';
    treatmentPlan.declined_at = new Date();
    treatmentPlan.declined_by = declined_by;
    treatmentPlan.decline_reason = reason?.trim() || null;
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async remove(plan_id: string): Promise<void> {
    const treatmentPlan = await this.findOne(plan_id);
    this.assertPlanEditable(treatmentPlan);
    await this.treatmentPlansRepository.remove(treatmentPlan);
  }

  private assertSessionMutable(session: ExaminationSessionEntity): void {
    const status = session.status?.toLowerCase();
    if (status === 'completed' || session.signed_at) {
      throw new ConflictException('Finalized examination sessions are locked');
    }
  }

  private assertPlanEditable(treatmentPlan: TreatmentPlanEntity): void {
    if (
      ['accepted', 'declined', 'in_progress', 'completed', 'cancelled'].includes(
        treatmentPlan.status,
      )
    ) {
      throw new ConflictException('Treatment plan status is locked');
    }
  }

  private assertPlanUpdatable(treatmentPlan: TreatmentPlanEntity): void {
    if (
      ['declined', 'completed', 'cancelled'].includes(treatmentPlan.status)
    ) {
      throw new ConflictException('Treatment plan status is locked');
    }
  }

  private assertContextUnchanged(
    treatmentPlan: TreatmentPlanEntity,
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ): void {
    const contextFields = [
      'session_id',
      'patient_id',
      'record_id',
      'created_by',
    ] as const;

    for (const field of contextFields) {
      const nextValue = updateTreatmentPlanDto[field];
      if (nextValue !== undefined && nextValue !== treatmentPlan[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }

  private hasPositiveEstimatedCost(value: string | number | null): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0;
  }

  private normalizeEstimatedCost(
    value: string | number | undefined,
  ): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return String(value);
  }
}
