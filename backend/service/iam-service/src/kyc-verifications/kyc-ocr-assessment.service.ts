import { Injectable } from '@nestjs/common';
import { KycOcrStatus } from './entities/kyc-verification.entity';

export type KycCheckStatus = 'PASS' | 'WARNING' | 'FAIL';
export type KycRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KycAssessmentCheck {
  code: string;
  label: string;
  status: KycCheckStatus;
  message: string;
}

export interface KycOcrAssessmentInput {
  submitted: {
    idNumber: string;
    fullName?: string | null;
    dateOfBirth?: string | null;
  };
  ocr: {
    status: KycOcrStatus | string;
    confidence: number | null;
    payload: Record<string, unknown>;
  };
}

export interface KycOcrAssessmentResult {
  riskLevel: KycRiskLevel;
  riskReason: string;
  checks: KycAssessmentCheck[];
}

@Injectable()
export class KycOcrAssessmentService {
  assess(input: KycOcrAssessmentInput): KycOcrAssessmentResult {
    const rawText = this.normalizeText(String(input.ocr.payload.rawText ?? ''));
    const extractedId = this.normalizeId(
      typeof input.ocr.payload.idNumber === 'string'
        ? input.ocr.payload.idNumber
        : this.findIdInText(rawText),
    );
    const submittedId = this.normalizeId(input.submitted.idNumber);
    const extractedDob =
      typeof input.ocr.payload.dateOfBirth === 'string'
        ? input.ocr.payload.dateOfBirth
        : null;

    const checks: KycAssessmentCheck[] = [
      this.checkOcrCompleted(input.ocr.status),
      this.checkConfidence(input.ocr.confidence),
      this.checkIdNumber(submittedId, extractedId),
      this.checkDateOfBirth(input.submitted.dateOfBirth, extractedDob, rawText),
      this.checkName(input.submitted.fullName, rawText),
    ];

    const hasFail = checks.some((check) => check.status === 'FAIL');
    const hasWarning = checks.some((check) => check.status === 'WARNING');
    const riskLevel: KycRiskLevel = hasFail ? 'HIGH' : hasWarning ? 'MEDIUM' : 'LOW';

    return {
      riskLevel,
      riskReason: this.riskReason(checks, riskLevel),
      checks,
    };
  }

  private checkOcrCompleted(status: KycOcrStatus | string): KycAssessmentCheck {
    if (status === KycOcrStatus.COMPLETED || status === 'COMPLETED') {
      return {
        code: 'OCR_COMPLETED',
        label: 'OCR completed',
        status: 'PASS',
        message: 'OCR extracted text from the identity document.',
      };
    }

    return {
      code: 'OCR_COMPLETED',
      label: 'OCR completed',
      status: 'FAIL',
      message: `OCR status is ${status || 'UNKNOWN'}. Manual review is required.`,
    };
  }

  private checkConfidence(confidence: number | null): KycAssessmentCheck {
    if (typeof confidence !== 'number') {
      return {
        code: 'OCR_CONFIDENCE',
        label: 'OCR confidence',
        status: 'WARNING',
        message: 'OCR confidence is not available.',
      };
    }

    if (confidence >= 80) {
      return {
        code: 'OCR_CONFIDENCE',
        label: 'OCR confidence',
        status: 'PASS',
        message: `OCR confidence is ${confidence}%.`,
      };
    }

    if (confidence >= 50) {
      return {
        code: 'OCR_CONFIDENCE',
        label: 'OCR confidence',
        status: 'WARNING',
        message: `OCR confidence is ${confidence}%, so manual attention is recommended.`,
      };
    }

    return {
      code: 'OCR_CONFIDENCE',
      label: 'OCR confidence',
      status: 'FAIL',
      message: `OCR confidence is ${confidence}%, which is too low.`,
    };
  }

  private checkIdNumber(submittedId: string, extractedId: string | null): KycAssessmentCheck {
    if (!extractedId) {
      return {
        code: 'ID_NUMBER_MATCH',
        label: 'ID number appears in OCR text',
        status: 'WARNING',
        message: 'OCR could not confidently extract an ID number.',
      };
    }

    if (submittedId === extractedId) {
      return {
        code: 'ID_NUMBER_MATCH',
        label: 'ID number appears in OCR text',
        status: 'PASS',
        message: 'Submitted ID number appears in OCR text.',
      };
    }

    return {
      code: 'ID_NUMBER_MATCH',
      label: 'ID number appears in OCR text',
      status: 'FAIL',
      message: 'ID number mismatch between submitted data and OCR result.',
    };
  }

  private checkDateOfBirth(
    submittedDob: string | null | undefined,
    extractedDob: string | null,
    rawText: string,
  ): KycAssessmentCheck {
    if (!submittedDob) {
      return {
        code: 'DOB_MATCH',
        label: 'Date of birth appears in OCR text',
        status: 'WARNING',
        message: 'Submitted date of birth is missing.',
      };
    }

    const submittedVariants = this.dateVariants(submittedDob);
    const appearsInText = submittedVariants.some((value) => rawText.includes(value));
    if (extractedDob === submittedDob || appearsInText) {
      return {
        code: 'DOB_MATCH',
        label: 'Date of birth appears in OCR text',
        status: 'PASS',
        message: 'Submitted date of birth appears in OCR text.',
      };
    }

    if (!extractedDob) {
      return {
        code: 'DOB_MATCH',
        label: 'Date of birth appears in OCR text',
        status: 'WARNING',
        message: 'OCR could not confidently extract date of birth.',
      };
    }

    return {
      code: 'DOB_MATCH',
      label: 'Date of birth appears in OCR text',
      status: 'WARNING',
      message: `OCR date of birth (${extractedDob}) differs from submitted value (${submittedDob}).`,
    };
  }

  private checkName(fullName: string | null | undefined, rawText: string): KycAssessmentCheck {
    if (!fullName) {
      return {
        code: 'NAME_APPEARS_IN_TEXT',
        label: 'Name appears in OCR text',
        status: 'WARNING',
        message: 'Submitted full name is missing.',
      };
    }

    const normalizedName = this.normalizeText(fullName);
    if (normalizedName && rawText.includes(normalizedName)) {
      return {
        code: 'NAME_APPEARS_IN_TEXT',
        label: 'Name appears in OCR text',
        status: 'PASS',
        message: 'Submitted full name appears in OCR text.',
      };
    }

    return {
      code: 'NAME_APPEARS_IN_TEXT',
      label: 'Name appears in OCR text',
      status: 'WARNING',
      message: 'Submitted full name was not confidently found in OCR text.',
    };
  }

  private riskReason(checks: KycAssessmentCheck[], riskLevel: KycRiskLevel): string {
    if (riskLevel === 'HIGH') {
      return checks.find((check) => check.status === 'FAIL')?.message ?? 'High risk KYC review.';
    }
    if (riskLevel === 'MEDIUM') {
      return checks.find((check) => check.status === 'WARNING')?.message ?? 'Manual attention is recommended.';
    }
    return 'OCR completed and submitted identity data appears consistent.';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeId(value: string | null | undefined): string {
    return (value ?? '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
  }

  private findIdInText(text: string): string | null {
    return text.match(/\b\d{9,12}\b/)?.[0] ?? null;
  }

  private dateVariants(value: string): string[] {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return [this.normalizeText(value)];
    const [, year, month, day] = match;
    return [
      `${year}-${month}-${day}`,
      `${day}/${month}/${year}`,
      `${day}-${month}-${year}`,
    ].map((item) => this.normalizeText(item));
  }
}
