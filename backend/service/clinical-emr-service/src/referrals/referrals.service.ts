import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralEntity, ReferralStatus } from './entities/referral.entity';
import { CreateReferralDto } from './dto/create-referral.dto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralEntity)
    private repo: Repository<ReferralEntity>,
  ) {}

  async create(dto: CreateReferralDto): Promise<ReferralEntity> {
    const referral = this.repo.create(dto);
    return this.repo.save(referral);
  }

  async findAll(): Promise<ReferralEntity[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(referral_id: string): Promise<ReferralEntity> {
    const referral = await this.repo.findOne({ where: { referral_id } });
    if (!referral) {
      throw new NotFoundException(`Referral ${referral_id} not found`);
    }
    return referral;
  }

  async findBySessionId(session_id: string): Promise<ReferralEntity[]> {
    return this.repo.find({
      where: { session_id },
      order: { created_at: 'DESC' },
    });
  }

  async findByPatientId(patient_id: string): Promise<ReferralEntity[]> {
    return this.repo.find({
      where: { patient_id },
      order: { created_at: 'DESC' },
    });
  }

  /** Cập nhật trạng thái giấy chuyển viện */
  async updateStatus(
    referral_id: string,
    status: ReferralStatus,
    accepted_by?: string,
  ): Promise<ReferralEntity> {
    const referral = await this.findOne(referral_id);
    referral.status = status;
    if (status === ReferralStatus.ACCEPTED) {
      referral.accepted_by = accepted_by ?? null;
      referral.accepted_at = new Date();
    }
    return this.repo.save(referral);
  }

  async cancel(referral_id: string): Promise<ReferralEntity> {
    return this.updateStatus(referral_id, ReferralStatus.CANCELLED);
  }
}
