import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalOrderEntity } from './entities/clinical-order.entity';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { UpdateClinicalOrderDto } from './dto/update-clinical-order.dto';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class ClinicalOrdersService {
  constructor(
    @InjectRepository(ClinicalOrderEntity)
    private clinicalOrdersRepository: Repository<ClinicalOrderEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private sessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(
    createClinicalOrderDto: CreateClinicalOrderDto,
  ): Promise<ClinicalOrderEntity> {
    if (!createClinicalOrderDto.session_id) {
      throw new BadRequestException('session_id is required');
    }

    const session = await this.sessionsRepository.findOne({
      where: { session_id: createClinicalOrderDto.session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${createClinicalOrderDto.session_id} not found`,
      );
    }
    this.assertSessionMutable(session);

    if (
      createClinicalOrderDto.patient_id &&
      session.patient_id &&
      createClinicalOrderDto.patient_id !== session.patient_id
    ) {
      throw new BadRequestException(
        'Clinical order patient does not match session',
      );
    }
    if (
      createClinicalOrderDto.ordered_by &&
      session.doctor_id &&
      createClinicalOrderDto.ordered_by !== session.doctor_id
    ) {
      throw new BadRequestException(
        'Clinical order doctor does not match session',
      );
    }
    if (
      createClinicalOrderDto.record_id &&
      session.record_id &&
      createClinicalOrderDto.record_id !== session.record_id
    ) {
      throw new BadRequestException(
        'Clinical order record does not match session',
      );
    }

    const clinicalOrder = this.clinicalOrdersRepository.create({
      ...createClinicalOrderDto,
      session_id: session.session_id,
      patient_id: session.patient_id ?? createClinicalOrderDto.patient_id,
      record_id: session.record_id ?? createClinicalOrderDto.record_id ?? null,
      ordered_by: session.doctor_id ?? createClinicalOrderDto.ordered_by,
      status: 'ordered',
    });
    return this.clinicalOrdersRepository.save(clinicalOrder);
  }

  async findAll(): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find();
  }

  async findOne(order_id: string): Promise<ClinicalOrderEntity> {
    const clinicalOrder = await this.clinicalOrdersRepository.findOne({
      where: { order_id },
    });
    if (!clinicalOrder) {
      throw new NotFoundException(
        `Clinical order with ID ${order_id} not found`,
      );
    }
    return clinicalOrder;
  }

  async findByPatientId(patient_id: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { patient_id },
    });
  }

  async findBySessionId(session_id: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { session_id },
    });
  }

  async findByRecordId(record_id: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { record_id },
    });
  }

  async findByOrderedBy(ordered_by: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { ordered_by },
    });
  }

  async findByStatus(status: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { status },
    });
  }

  async update(
    order_id: string,
    updateClinicalOrderDto: UpdateClinicalOrderDto,
  ): Promise<ClinicalOrderEntity> {
    const clinicalOrder = await this.findOne(order_id);
    this.assertContextUnchanged(clinicalOrder, updateClinicalOrderDto);
    if (
      updateClinicalOrderDto.status === 'completed' &&
      !updateClinicalOrderDto.completed_date &&
      !clinicalOrder.completed_date
    ) {
      updateClinicalOrderDto.completed_date = new Date().toISOString();
    }

    Object.assign(clinicalOrder, updateClinicalOrderDto);
    return this.clinicalOrdersRepository.save(clinicalOrder);
  }

  async remove(order_id: string): Promise<void> {
    const clinicalOrder = await this.findOne(order_id);
    await this.assertLinkedSessionMutable(clinicalOrder);
    await this.clinicalOrdersRepository.remove(clinicalOrder);
  }

  private async assertLinkedSessionMutable(
    clinicalOrder: ClinicalOrderEntity,
  ): Promise<void> {
    if (!clinicalOrder.session_id) {
      return;
    }

    const session = await this.sessionsRepository.findOne({
      where: { session_id: clinicalOrder.session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${clinicalOrder.session_id} not found`,
      );
    }
    this.assertSessionMutable(session);
  }

  private assertSessionMutable(session: ExaminationSessionEntity): void {
    const status = session.status?.toLowerCase();
    if (status === 'completed' || session.signed_at) {
      throw new ConflictException('Finalized examination sessions are locked');
    }
  }

  private assertContextUnchanged(
    clinicalOrder: ClinicalOrderEntity,
    updateClinicalOrderDto: UpdateClinicalOrderDto,
  ): void {
    const contextFields = [
      'session_id',
      'patient_id',
      'record_id',
      'ordered_by',
    ] as const;

    for (const field of contextFields) {
      const nextValue = updateClinicalOrderDto[field];
      if (nextValue !== undefined && nextValue !== clinicalOrder[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
