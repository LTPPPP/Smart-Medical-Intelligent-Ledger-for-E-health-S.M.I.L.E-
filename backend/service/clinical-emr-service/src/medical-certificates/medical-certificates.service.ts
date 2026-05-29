import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MedicalCertificateEntity,
  MedicalCertificateStatus,
} from './entities/medical-certificate.entity';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto';

@Injectable()
export class MedicalCertificatesService {
  constructor(
    @InjectRepository(MedicalCertificateEntity)
    private repo: Repository<MedicalCertificateEntity>,
  ) {}

  async create(
    dto: CreateMedicalCertificateDto,
  ): Promise<MedicalCertificateEntity> {
    const cert = this.repo.create(dto);
    return this.repo.save(cert);
  }

  async findAll(): Promise<MedicalCertificateEntity[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(cert_id: string): Promise<MedicalCertificateEntity> {
    const cert = await this.repo.findOne({ where: { cert_id } });
    if (!cert) {
      throw new NotFoundException(`Medical certificate ${cert_id} not found`);
    }
    return cert;
  }

  async findBySessionId(
    session_id: string,
  ): Promise<MedicalCertificateEntity[]> {
    return this.repo.find({
      where: { session_id },
      order: { created_at: 'DESC' },
    });
  }

  async findByPatientId(
    patient_id: string,
  ): Promise<MedicalCertificateEntity[]> {
    return this.repo.find({
      where: { patient_id },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Hủy giấy chứng nhận — chỉ bác sĩ điều trị mới được hủy
   * Tuân thủ Nghị định 13/2023/NĐ-CP: ghi lại audit (voided_by, voided_at, void_reason)
   */
  async void(
    cert_id: string,
    voided_by: string,
    void_reason: string,
  ): Promise<MedicalCertificateEntity> {
    const cert = await this.findOne(cert_id);
    if (cert.status === MedicalCertificateStatus.VOIDED) {
      throw new ForbiddenException('Certificate is already voided');
    }
    cert.status = MedicalCertificateStatus.VOIDED;
    cert.voided_by = voided_by;
    cert.void_reason = void_reason;
    cert.voided_at = new Date();
    return this.repo.save(cert);
  }
}
