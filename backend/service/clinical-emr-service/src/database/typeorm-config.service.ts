import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AllConfigType } from '../config/config.type';
import { ClinicalOrderEntity } from '../clinical-orders/entities/clinical-order.entity';
import { DentalChartEntity } from '../dental-charts/entities/dental-chart.entity';
import { DentalImageEntity } from '../dental-images/entities/dental-image.entity';
import { DiagnosisEntity } from '../diagnoses/entities/diagnosis.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { ExaminationSessionAmendmentEntity } from '../examination-sessions/entities/examination-session-amendment.entity';
import { ImageAnnotationEntity } from '../image-annotations/entities/image-annotation.entity';
import { ImageCategoryEntity } from '../image-categories/entities/image-category.entity';
import { LabTestResultEntity } from '../lab-test-results/entities/lab-test-result.entity';
import { MedicalHistoryEntity } from '../medical-history/entities/medical-history.entity';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';
import { MedicalRecordVersionEntity } from '../medical-records/entities/medical-record-version.entity';
import { PacsSyncLogEntity } from '../pacs-sync-logs/entities/pacs-sync-log.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { PatientRepresentativeEntity } from '../patient-representatives/entities/patient-representative.entity';
import { PrescriptionItemEntity } from '../prescription-items/entities/prescription-item.entity';
import { PrescriptionEntity } from '../prescriptions/entities/prescription.entity';
import { RecordExportEntity } from '../record-exports/entities/record-export.entity';
import { SymptomEntity } from '../symptoms/entities/symptom.entity';
import { TreatmentHistoryEntity } from '../treatment-history/entities/treatment-history.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';

// Entities owned by core_medical_service_db only. Clinic-owned entities
// (appointments, clinics, schedules, services, ...) are registered on the
// named 'clinicConnection' in app.module.ts and must not leak into this
// connection's metadata.
const MEDICAL_ENTITIES = [
  ClinicalOrderEntity,
  DentalChartEntity,
  DentalImageEntity,
  DiagnosisEntity,
  ExaminationSessionEntity,
  ExaminationSessionAmendmentEntity,
  ImageAnnotationEntity,
  ImageCategoryEntity,
  LabTestResultEntity,
  MedicalHistoryEntity,
  MedicalRecordEntity,
  MedicalRecordVersionEntity,
  PacsSyncLogEntity,
  PatientEntity,
  PatientRepresentativeEntity,
  PrescriptionItemEntity,
  PrescriptionEntity,
  RecordExportEntity,
  SymptomEntity,
  TreatmentHistoryEntity,
  TreatmentPlanEntity,
];

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<AllConfigType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get('database.type', { infer: true }),
      url: this.configService.get('database.url', { infer: true }),
      host: this.configService.get('database.host', { infer: true }),
      port: this.configService.get('database.port', { infer: true }),
      username: this.configService.get('database.username', { infer: true }),
      password: this.configService.get('database.password', { infer: true }),
      database: this.configService.get('database.name', { infer: true }),
      synchronize: this.configService.get('database.synchronize', {
        infer: true,
      }),
      dropSchema: false,
      keepConnectionAlive: true,
      logging:
        this.configService.get('app.nodeEnv', { infer: true }) !== 'production',
      entities: MEDICAL_ENTITIES,
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      cli: {
        entitiesDir: 'src',

        subscribersDir: 'subscriber',
      },
      extra: {
        // based on https://node-postgres.com/apis/pool
        // max connection pool size
        max: this.configService.get('database.maxConnections', { infer: true }),
        ssl: this.configService.get('database.sslEnabled', { infer: true })
          ? {
              rejectUnauthorized: this.configService.get(
                'database.rejectUnauthorized',
                { infer: true },
              ),
              ca:
                this.configService.get('database.ca', { infer: true }) ??
                undefined,
              key:
                this.configService.get('database.key', { infer: true }) ??
                undefined,
              cert:
                this.configService.get('database.cert', { infer: true }) ??
                undefined,
            }
          : undefined,
      },
    } as TypeOrmModuleOptions;
  }
}
