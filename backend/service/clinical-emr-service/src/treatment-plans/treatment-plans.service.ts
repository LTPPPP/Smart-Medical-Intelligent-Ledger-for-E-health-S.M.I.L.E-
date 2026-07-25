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
import { PatientRepresentativesService } from '../patient-representatives/patient-representatives.service';
import { PlanStatus } from '../utils/enums/plan-status.enum';
import { AcceptanceScope } from '../utils/enums/acceptance-scope.enum';
import { Currency } from '../utils/enums/currency.enum';

@Injectable()
export class TreatmentPlansService {
  private readonly workflowFields: (keyof CreateTreatmentPlanDto)[] = [
    'sent_at',
    'sent_to',
    'sent_via',
    'confirmed_at',
    'proposed_at',
    'accepted_at',
    'accepted_by',
    'declined_at',
    'declined_by',
    'decline_reason',
    'acceptance_scope',
    'accepted_scope_note',
  ];

  constructor(
    @InjectRepository(TreatmentPlanEntity)
    private treatmentPlansRepository: Repository<TreatmentPlanEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private sessionsRepository: Repository<ExaminationSessionEntity>,
    private patientRepresentativesService: PatientRepresentativesService,
  ) {}

  async create(
    createTreatmentPlanDto: CreateTreatmentPlanDto,
  ): Promise<TreatmentPlanEntity> {
    if (!createTreatmentPlanDto.session_id) {
      throw new BadRequestException('session_id is required');
    }
    this.assertCreateWorkflowFieldsAbsent(createTreatmentPlanDto);

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
      throw new BadRequestException(
        'Treatment plan patient does not match session',
      );
    }
    if (
      createTreatmentPlanDto.created_by &&
      session.doctor_id &&
      createTreatmentPlanDto.created_by !== session.doctor_id
    ) {
      throw new BadRequestException(
        'Treatment plan doctor does not match session',
      );
    }
    if (
      createTreatmentPlanDto.record_id &&
      session.record_id &&
      createTreatmentPlanDto.record_id !== session.record_id
    ) {
      throw new BadRequestException(
        'Treatment plan record does not match session',
      );
    }

    const treatmentPlan = this.treatmentPlansRepository.create({
      ...createTreatmentPlanDto,
      session_id: session.session_id,
      patient_id: session.patient_id ?? createTreatmentPlanDto.patient_id,
      record_id: session.record_id ?? createTreatmentPlanDto.record_id ?? null,
      created_by: session.doctor_id ?? createTreatmentPlanDto.created_by,
      status: PlanStatus.DRAFT,
      estimated_cost: this.normalizeEstimatedCost(
        createTreatmentPlanDto.estimated_cost,
      ),
      quote_currency: createTreatmentPlanDto.quote_currency ?? Currency.VND,
      quote_version: this.normalizeOptionalText(
        createTreatmentPlanDto.quote_version,
      ),
      risk_disclosure: this.normalizeOptionalText(
        createTreatmentPlanDto.risk_disclosure,
      ),
      alternative_options: this.normalizeOptionalText(
        createTreatmentPlanDto.alternative_options,
      ),
    });
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async findAll(): Promise<TreatmentPlanEntity[]> {
    return this.treatmentPlansRepository.find();
  }

  async findOne(plan_id: string): Promise<TreatmentPlanEntity> {
    const treatmentPlan = await this.treatmentPlansRepository.findOne({
      where: { plan_id },
      relations: ['session', 'patient'],
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

  async findBySessionId(session_id: string): Promise<TreatmentPlanEntity[]> {
    return this.treatmentPlansRepository.find({
      where: { session_id },
      order: { created_at: 'DESC' },
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
    this.assertStatusUpdateAllowed(treatmentPlan, updateTreatmentPlanDto);
    this.assertWorkflowFieldsUnchanged(updateTreatmentPlanDto);
    this.assertAcceptedPlanUpdate(treatmentPlan, updateTreatmentPlanDto);
    if (
      updateTreatmentPlanDto.status === PlanStatus.IN_PROGRESS &&
      !this.acceptedStatuses().includes(treatmentPlan.status)
    ) {
      throw new ConflictException(
        'Treatment plan must be accepted before progress',
      );
    }

    Object.assign(treatmentPlan, updateTreatmentPlanDto);
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  private assertCreateWorkflowFieldsAbsent(
    createTreatmentPlanDto: CreateTreatmentPlanDto,
  ): void {
    if (
      createTreatmentPlanDto.status !== undefined &&
      createTreatmentPlanDto.status !== PlanStatus.DRAFT
    ) {
      throw new BadRequestException('New treatment plans must start as draft.');
    }

    const suppliedWorkflowFields = this.workflowFields.filter(
      (field) => createTreatmentPlanDto[field] !== undefined,
    );
    if (suppliedWorkflowFields.length) {
      throw new BadRequestException(
        `Treatment plan workflow fields cannot be set on creation: ${suppliedWorkflowFields.join(', ')}.`,
      );
    }
  }

  async propose(plan_id: string): Promise<TreatmentPlanEntity> {
    const treatmentPlan = await this.findOne(plan_id);
    this.assertPlanEditable(treatmentPlan);
    if (treatmentPlan.status !== PlanStatus.DRAFT) {
      throw new ConflictException('Only draft treatment plans can be proposed');
    }
    if (!this.hasPositiveEstimatedCost(treatmentPlan.estimated_cost)) {
      throw new BadRequestException(
        'estimated_cost is required before proposing treatment plan',
      );
    }
    if (!this.hasText(treatmentPlan.quote_version)) {
      throw new BadRequestException(
        'quote_version is required before proposing treatment plan',
      );
    }
    if (!this.hasText(treatmentPlan.risk_disclosure)) {
      throw new BadRequestException(
        'risk_disclosure is required before proposing treatment plan',
      );
    }
    if (!this.hasText(treatmentPlan.alternative_options)) {
      throw new BadRequestException(
        'alternative_options is required before proposing treatment plan',
      );
    }

    treatmentPlan.status = PlanStatus.PROPOSED;
    treatmentPlan.proposed_at = new Date();
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async accept(
    plan_id: string,
    accepted_by: string,
    options: {
      acceptance_scope?: 'full' | 'partial';
      accepted_scope_note?: string;
    } = {},
  ): Promise<TreatmentPlanEntity> {
    if (!accepted_by?.trim()) {
      throw new BadRequestException('accepted_by is required');
    }

    const acceptanceScope =
      options.acceptance_scope === 'partial' ? 'partial' : 'full';
    const acceptedScopeNote = this.normalizeOptionalText(
      options.accepted_scope_note,
    );
    if (acceptanceScope === 'partial' && !acceptedScopeNote) {
      throw new BadRequestException(
        'accepted_scope_note is required for partial acceptance',
      );
    }

    const treatmentPlan = await this.findOne(plan_id);
    this.assertPlanSessionMutable(treatmentPlan);
    if (treatmentPlan.status !== PlanStatus.PROPOSED) {
      throw new ConflictException(
        'Only proposed treatment plans can be accepted',
      );
    }
    await this.applyMinorRepresentativeSnapshot(treatmentPlan);

    treatmentPlan.status =
      acceptanceScope === AcceptanceScope.PARTIAL
        ? PlanStatus.PARTIALLY_ACCEPTED
        : PlanStatus.ACCEPTED;
    treatmentPlan.accepted_at = new Date();
    treatmentPlan.accepted_by = accepted_by;
    treatmentPlan.acceptance_scope = acceptanceScope;
    treatmentPlan.accepted_scope_note = acceptedScopeNote;
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
    this.assertPlanSessionMutable(treatmentPlan);
    if (treatmentPlan.status !== PlanStatus.PROPOSED) {
      throw new ConflictException(
        'Only proposed treatment plans can be declined',
      );
    }

    treatmentPlan.status = PlanStatus.DECLINED;
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
    this.assertPlanSessionMutable(treatmentPlan);
    if (
      [
        'accepted',
        'partially_accepted',
        'declined',
        'in_progress',
        'completed',
        'cancelled',
      ].includes(treatmentPlan.status)
    ) {
      throw new ConflictException('Treatment plan status is locked');
    }
  }

  private assertPlanUpdatable(treatmentPlan: TreatmentPlanEntity): void {
    this.assertPlanSessionMutable(treatmentPlan);
    if (['declined', 'completed', 'cancelled'].includes(treatmentPlan.status)) {
      throw new ConflictException('Treatment plan status is locked');
    }
  }

  private assertPlanSessionMutable(treatmentPlan: TreatmentPlanEntity): void {
    if (treatmentPlan.session) {
      this.assertSessionMutable(treatmentPlan.session);
    }
  }

  private async applyMinorRepresentativeSnapshot(
    treatmentPlan: TreatmentPlanEntity,
  ): Promise<void> {
    if (!this.isMinorPatient(treatmentPlan.patient?.date_of_birth)) {
      return;
    }

    const representative =
      await this.patientRepresentativesService.findAuthorizedRepresentative(
        treatmentPlan.patient_id,
        'treatment',
      );

    treatmentPlan.accepted_representative_id = representative.representative_id;
    treatmentPlan.accepted_representative_name = representative.full_name;
    treatmentPlan.accepted_representative_relationship =
      representative.relationship;
    treatmentPlan.accepted_representative_phone = representative.phone;
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

  private assertStatusUpdateAllowed(
    treatmentPlan: TreatmentPlanEntity,
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ): void {
    if (
      updateTreatmentPlanDto.status === undefined ||
      updateTreatmentPlanDto.status === treatmentPlan.status
    ) {
      return;
    }

    if (
      this.acceptedStatuses().includes(treatmentPlan.status) &&
      updateTreatmentPlanDto.status === PlanStatus.IN_PROGRESS
    ) {
      return;
    }

    throw new ConflictException(
      'Use the dedicated treatment plan workflow endpoints to change status.',
    );
  }

  private assertWorkflowFieldsUnchanged(
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ): void {
    const changedFields = this.workflowFields.filter(
      (field) => updateTreatmentPlanDto[field] !== undefined,
    );
    if (changedFields.length) {
      throw new ConflictException(
        `Treatment plan workflow fields cannot be updated directly: ${changedFields.join(', ')}.`,
      );
    }
  }

  private assertAcceptedPlanUpdate(
    treatmentPlan: TreatmentPlanEntity,
    updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ): void {
    if (!this.acceptedStatuses().includes(treatmentPlan.status)) {
      return;
    }

    const changedFields = (
      Object.keys(updateTreatmentPlanDto) as (keyof UpdateTreatmentPlanDto)[]
    ).filter((field) => updateTreatmentPlanDto[field] !== undefined);
    const movesIntoProgress =
      changedFields.length === 1 &&
      updateTreatmentPlanDto.status === PlanStatus.IN_PROGRESS;

    if (!movesIntoProgress) {
      throw new ConflictException(
        'Accepted treatment plan details are locked. Move it into progress or create a new plan.',
      );
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

  private hasText(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private isMinorPatient(dateOfBirth?: Date | string | null): boolean {
    if (!dateOfBirth) {
      return false;
    }

    const birthDate =
      dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (
      monthDelta < 0 ||
      (monthDelta === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age < 18;
  }

  private acceptedStatuses(): string[] {
    return ['accepted', 'partially_accepted'];
  }
}
