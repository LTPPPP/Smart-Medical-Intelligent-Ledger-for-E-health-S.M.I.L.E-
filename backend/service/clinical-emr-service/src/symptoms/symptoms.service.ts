import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SymptomEntity } from './entities/symptom.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectRepository(SymptomEntity)
    private symptomsRepository: Repository<SymptomEntity>,
  ) {}

  async create(createSymptomDto: CreateSymptomDto): Promise<SymptomEntity> {
    const symptom = this.symptomsRepository.create(createSymptomDto);
    return this.symptomsRepository.save(symptom);
  }

  async findAll(): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find();
  }

  async findOne(symptom_id: string): Promise<SymptomEntity> {
    const symptom = await this.symptomsRepository.findOne({
      where: { symptom_id },
    });
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID ${symptom_id} not found`);
    }
    return symptom;
  }

  async findBySessionId(session_id: string): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find({
      where: { session_id },
    });
  }

  async findByPatientId(patient_id: string): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find({
      where: { patient_id },
    });
  }

  async update(
    symptom_id: string,
    updateSymptomDto: UpdateSymptomDto,
  ): Promise<SymptomEntity> {
    const symptom = await this.findOne(symptom_id);
    Object.assign(symptom, updateSymptomDto);
    return this.symptomsRepository.save(symptom);
  }

  async remove(symptom_id: string): Promise<void> {
    const symptom = await this.findOne(symptom_id);
    await this.symptomsRepository.remove(symptom);
  }
}
