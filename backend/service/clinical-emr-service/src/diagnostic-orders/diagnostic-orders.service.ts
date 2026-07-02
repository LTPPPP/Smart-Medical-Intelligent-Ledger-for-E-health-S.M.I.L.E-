import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticOrderEntity } from './entities/diagnostic-order.entity';
import { CreateDiagnosticOrderDto } from './dto/create-diagnostic-order.dto';
import { UpdateDiagnosticOrderDto } from './dto/update-diagnostic-order.dto';
import { NullableType } from '../utils/types/nullable.type';
import { OrderStatus } from '../utils/enums/order-status.enum';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class DiagnosticOrdersService {
  constructor(
    @InjectRepository(DiagnosticOrderEntity, 'clinicConnection')
    private readonly orderRepository: Repository<DiagnosticOrderEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private readonly sessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  private generateOrderCode(orderType: string): string {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = orderType.toUpperCase().replace('_', '');
    return `DO-${prefix}-${dateStr}-${rand}`;
  }

  // UC-075/076/077/078: Create diagnostic order
  async create(dto: CreateDiagnosticOrderDto): Promise<DiagnosticOrderEntity> {
    const session = await this.sessionsRepository.findOne({
      where: { appointment_id: dto.appointment_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session for appointment ${dto.appointment_id} not found`,
      );
    }
    this.assertSessionMutable(session);

    if (session.patient_id && dto.patient_id !== session.patient_id) {
      throw new BadRequestException(
        'Diagnostic order patient does not match session',
      );
    }
    if (session.doctor_id && dto.doctor_id !== session.doctor_id) {
      throw new BadRequestException(
        'Diagnostic order doctor does not match session',
      );
    }

    const order = this.orderRepository.create({
      ...dto,
      patient_id: session.patient_id ?? dto.patient_id,
      doctor_id: session.doctor_id ?? dto.doctor_id,
      order_code: this.generateOrderCode(dto.order_type),
      status: OrderStatus.ORDERED,
      ordered_at: new Date(),
    });
    return this.orderRepository.save(order);
  }

  async findById(id: string): Promise<NullableType<DiagnosticOrderEntity>> {
    return this.orderRepository.findOne({
      where: { order_id: id },
      relations: ['appointment'],
    });
  }

  async findByCode(code: string): Promise<NullableType<DiagnosticOrderEntity>> {
    return this.orderRepository.findOne({
      where: { order_code: code },
      relations: ['appointment'],
    });
  }

  // Get orders by appointment
  async findByAppointment(
    appointmentId: string,
  ): Promise<DiagnosticOrderEntity[]> {
    return this.orderRepository.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  }

  // Get orders by patient
  async findByPatient(patientId: string): Promise<DiagnosticOrderEntity[]> {
    return this.orderRepository.find({
      where: { patient_id: patientId },
      relations: ['appointment'],
      order: { created_at: 'DESC' },
    });
  }

  // UC-075~078: Update order (add results, change status)
  async update(
    id: string,
    dto: UpdateDiagnosticOrderDto,
  ): Promise<DiagnosticOrderEntity> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException(`Diagnostic order with ID ${id} not found`);
    }
    await this.assertAppointmentSessionMutable(order.appointment_id);

    // If completing, set completed_at
    if (
      dto.status === OrderStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      (dto as any).completed_at = new Date();
    }

    Object.assign(order, dto);
    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException(`Diagnostic order with ID ${id} not found`);
    }
    await this.assertAppointmentSessionMutable(order.appointment_id);
    await this.orderRepository.remove(order);
  }

  private async assertAppointmentSessionMutable(
    appointmentId: string,
  ): Promise<void> {
    const session = await this.sessionsRepository.findOne({
      where: { appointment_id: appointmentId },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session for appointment ${appointmentId} not found`,
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
}
