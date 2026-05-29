import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCertificatesService } from './medical-certificates.service';
import { MedicalCertificatesController } from './medical-certificates.controller';
import { MedicalCertificateEntity } from './entities/medical-certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCertificateEntity])],
  controllers: [MedicalCertificatesController],
  providers: [MedicalCertificatesService],
  exports: [MedicalCertificatesService],
})
export class MedicalCertificatesModule {}
