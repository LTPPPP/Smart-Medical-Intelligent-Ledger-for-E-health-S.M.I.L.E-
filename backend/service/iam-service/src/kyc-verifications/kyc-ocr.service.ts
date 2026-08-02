import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createReadStream } from 'fs';
import FormData = require('form-data');
import { basename } from 'path';
import { KycOcrStatus } from './entities/kyc-verification.entity';
import { serializeSanitizedErrorMetadata } from '../common/error-metadata';

export interface KycOcrInput {
  idFrontPath: string;
  idBackPath: string;
  expectedIdNumber: string;
  expectedDateOfBirth?: string | null;
}

export interface KycOcrResult {
  status: KycOcrStatus;
  confidence: number | null;
  payload: Record<string, unknown>;
}

@Injectable()
export class KycOcrService {
  async extractIdentity(input: KycOcrInput): Promise<KycOcrResult> {
    if (process.env.KYC_OCR_ENABLED !== 'true') {
      return {
        status: KycOcrStatus.SKIPPED,
        confidence: null,
        payload: {
          skipped: true,
          reason: 'OCR is disabled',
        },
      };
    }

    try {
      const form = new FormData();
      form.append('id_front', createReadStream(input.idFrontPath), basename(input.idFrontPath));
      form.append('id_back', createReadStream(input.idBackPath), basename(input.idBackPath));
      form.append('expected_id_number', input.expectedIdNumber);
      if (input.expectedDateOfBirth) {
        form.append('expected_date_of_birth', input.expectedDateOfBirth);
      }

      const response = await axios.post(`${this.ocrUrl()}/v1/ocr/cccd`, form, {
        headers: form.getHeaders(),
        timeout: this.timeoutMs(),
      });

      const payload = this.normalizeOcrPayload(response.data);
      return {
        status: KycOcrStatus.COMPLETED,
        confidence: this.extractConfidence(response.data),
        payload,
      };
    } catch (error) {
      return {
        status: KycOcrStatus.FAILED,
        confidence: null,
        payload: {
          error: serializeSanitizedErrorMetadata(error),
        },
      };
    }
  }

  private timeoutMs(): number {
    const value = Number(process.env.KYC_OCR_TIMEOUT_MS);
    return Number.isFinite(value) && value > 0 ? value : 30000;
  }

  private ocrUrl(): string {
    return (process.env.KYC_OCR_URL || 'http://localhost:8010').replace(/\/+$/, '');
  }

  private normalizeOcrPayload(data: Record<string, unknown>): Record<string, unknown> {
    const front = this.asRecord(data.front);
    const back = this.asRecord(data.back);
    const frontFields = this.asRecord(front.fields);
    const backFields = this.asRecord(back.fields);
    const rawText = [front.raw_text, back.raw_text]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join('\n');

    return {
      provider: String(data.engine ?? 'kyc-ocr'),
      rawText,
      documentType: this.stringField(frontFields.document_type) ?? this.stringField(backFields.document_type),
      idNumber: this.stringField(frontFields.id_number) ?? this.stringField(backFields.id_number),
      fullName: this.stringField(frontFields.full_name),
      dateOfBirth: this.stringField(frontFields.date_of_birth),
      issueDate: this.stringField(backFields.issue_date),
      expiryDate: this.stringField(backFields.expiry_date),
      placeOfOrigin: this.stringField(frontFields.place_of_origin),
      placeOfResidence: this.stringField(frontFields.place_of_residence),
      riskLevel: this.stringField(data.risk_level)?.toUpperCase() ?? null,
      automatedChecks: [
        ...this.flattenChecks(data.checks),
        ...this.flattenChecks(front.checks, 'FRONT'),
        ...this.flattenChecks(back.checks, 'BACK'),
      ],
      front,
      back,
    };
  }

  private extractConfidence(data: Record<string, unknown>): number | null {
    const confidences = [
      ...this.extractLineConfidences(this.asRecord(data.front).lines),
      ...this.extractLineConfidences(this.asRecord(data.back).lines),
    ];
    if (confidences.length === 0) return null;
    const average = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
    return Math.round(average * 100);
  }

  private extractLineConfidences(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((line) => this.asRecord(line).confidence)
      .filter((confidence): confidence is number => typeof confidence === 'number');
  }

  private flattenChecks(value: unknown, prefix?: string): Array<Record<string, unknown>> {
    const checks = this.asRecord(value);
    return Object.entries(checks)
      .filter(([code]) => !this.isInapplicableSideHint(prefix, code))
      .map(([code, check]) => {
        const detail = this.asRecord(check);
        const normalizedCode = prefix ? `${prefix}_${code}` : code;
        return {
          code: normalizedCode,
          label: this.titleize(normalizedCode),
          status: this.stringField(detail.status) ?? 'WARNING',
          message: this.stringField(detail.message) ?? normalizedCode,
          value: detail.value ?? null,
        };
      });
  }

  private isInapplicableSideHint(prefix: string | undefined, code: string): boolean {
    return (prefix === 'FRONT' && code === 'BACK_SIDE_HINT') || (prefix === 'BACK' && code === 'FRONT_SIDE_HINT');
  }

  private titleize(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private stringField(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
