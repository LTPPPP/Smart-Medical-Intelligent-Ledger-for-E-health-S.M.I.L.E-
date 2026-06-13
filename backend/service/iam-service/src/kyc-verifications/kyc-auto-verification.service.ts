import { Injectable } from '@nestjs/common';
import {
  KycOcrStatus,
  KycStatus,
} from './entities/kyc-verification.entity';

export interface KycAutoVerificationInput {
  verificationStatus: KycStatus;
  ocrStatus: KycOcrStatus;
  confidence: number | null;
  submitted: {
    idNumber: string;
    fullName: string | null;
    dateOfBirth: string | null;
  };
  payload: Record<string, unknown>;
}

export interface KycAutoVerificationDecision {
  eligible: boolean;
  reason: string;
  failedCriteria: string[];
}

@Injectable()
export class KycAutoVerificationService {
  evaluate(input: KycAutoVerificationInput): KycAutoVerificationDecision {
    const failedCriteria: string[] = [];
    const threshold = this.confidenceThreshold();

    if (input.verificationStatus !== KycStatus.PENDING_REVIEW) {
      failedCriteria.push('DECISION_NOT_PENDING');
    }
    if (input.ocrStatus !== KycOcrStatus.COMPLETED) {
      failedCriteria.push('OCR_NOT_COMPLETED');
    }
    if (!Number.isFinite(input.confidence)) {
      failedCriteria.push('CONFIDENCE_UNAVAILABLE');
    } else if ((input.confidence as number) < threshold) {
      failedCriteria.push('CONFIDENCE_BELOW_THRESHOLD');
    }
    if (this.stringValue(input.payload.riskLevel)?.toUpperCase() !== 'LOW') {
      failedCriteria.push('RISK_NOT_LOW');
    }
    if (this.stringValue(input.payload.documentType)?.toUpperCase() !== 'CITIZEN_ID') {
      failedCriteria.push('DOCUMENT_TYPE_MISMATCH');
    }
    if (this.detectedSide(input.payload.front, 'FRONT') !== 'FRONT') {
      failedCriteria.push('FRONT_SIDE_MISMATCH');
    }
    if (this.detectedSide(input.payload.back, 'BACK') !== 'BACK') {
      failedCriteria.push('BACK_SIDE_MISMATCH');
    }
    if (
      this.normalizeId(input.submitted.idNumber) !==
      this.normalizeId(this.stringValue(input.payload.idNumber))
    ) {
      failedCriteria.push('ID_NUMBER_MISMATCH');
    }
    if (
      !input.submitted.fullName ||
      this.normalizeVietnamese(input.submitted.fullName) !==
        this.normalizeVietnamese(this.stringValue(input.payload.fullName))
    ) {
      failedCriteria.push('FULL_NAME_MISMATCH');
    }
    if (
      !input.submitted.dateOfBirth ||
      this.normalizeDate(input.submitted.dateOfBirth) !==
        this.normalizeDate(this.stringValue(input.payload.dateOfBirth))
    ) {
      failedCriteria.push('DATE_OF_BIRTH_MISMATCH');
    }

    const checks = this.checks(input.payload.checks);
    if (checks.length === 0 || checks.some((check) => check.status !== 'PASS')) {
      failedCriteria.push('NON_PASSING_CHECKS');
    }

    return failedCriteria.length === 0
      ? {
          eligible: true,
          reason: 'All automatic verification checks passed.',
          failedCriteria,
        }
      : {
          eligible: false,
          reason: 'Automatic verification criteria were not fully satisfied.',
          failedCriteria: [...new Set(failedCriteria)],
        };
  }

  private confidenceThreshold(): number {
    const configured = Number(process.env.KYC_AUTO_VERIFY_CONFIDENCE);
    return Number.isFinite(configured) && configured > 0 ? configured : 80;
  }

  private detectedSide(value: unknown, expected: 'FRONT' | 'BACK'): string | null {
    const record = this.record(value);
    const fields = this.record(record.fields);
    const direct = this.stringValue(record.side) ?? this.stringValue(fields.side);
    if (direct) {
      return direct.toUpperCase();
    }

    const checks = this.record(record.checks);
    const sideHint = this.record(checks[`${expected}_SIDE_HINT`]);
    return this.stringValue(sideHint.status)?.toUpperCase() === 'PASS' ? expected : null;
  }

  private checks(value: unknown): Array<{ status: string }> {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.record(item))
      .map((item) => ({ status: this.stringValue(item.status)?.toUpperCase() ?? '' }));
  }

  private normalizeVietnamese(value: string | null): string {
    return (value ?? '')
      .replace(/Đ/g, 'D')
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeId(value: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private normalizeDate(value: string | null): string {
    if (!value) {
      return '';
    }
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    const local = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    return local ? `${local[3]}-${local[2]}-${local[1]}` : value.trim();
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
