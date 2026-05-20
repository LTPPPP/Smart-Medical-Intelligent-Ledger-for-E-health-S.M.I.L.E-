import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentPlanEntity } from './entities/treatment-plan.entity';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';

@Injectable()
export class TreatmentPlansService {
  constructor(
    @InjectRepository(TreatmentPlanEntity)
    private treatmentPlansRepository: Repository<TreatmentPlanEntity>,
  ) {}

  async create(
    createTreatmentPlanDto: CreateTreatmentPlanDto,
  ): Promise<TreatmentPlanEntity> {
    const treatmentPlan = this.treatmentPlansRepository.create(
      createTreatmentPlanDto,
    );
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
    Object.assign(treatmentPlan, updateTreatmentPlanDto);
    return this.treatmentPlansRepository.save(treatmentPlan);
  }

  async remove(plan_id: string): Promise<void> {
    const treatmentPlan = await this.findOne(plan_id);
    await this.treatmentPlansRepository.remove(treatmentPlan);
  }
}
