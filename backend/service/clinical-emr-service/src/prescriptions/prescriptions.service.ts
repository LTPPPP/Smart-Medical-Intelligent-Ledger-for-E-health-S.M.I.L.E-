import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(PrescriptionEntity)
    private prescriptionsRepository: Repository<PrescriptionEntity>,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    const prescription = this.prescriptionsRepository.create(
      createPrescriptionDto,
    );
    return this.prescriptionsRepository.save(prescription);
  }

  async findAll(): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find();
  }

  async findOne(prescription_id: string): Promise<PrescriptionEntity> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { prescription_id },
    });
    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${prescription_id} not found`,
      );
    }
    return prescription;
  }

  async findByPatientId(patient_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { patient_id },
    });
  }

  async findByDoctorId(doctor_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { doctor_id },
    });
  }

  async findByRecordId(record_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { record_id },
    });
  }

  async update(
    prescription_id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    const prescription = await this.findOne(prescription_id);
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionsRepository.save(prescription);
  }

  async remove(prescription_id: string): Promise<void> {
    const prescription = await this.findOne(prescription_id);
    await this.prescriptionsRepository.remove(prescription);
  }
}
