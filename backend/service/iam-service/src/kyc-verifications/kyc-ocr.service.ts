import { Injectable } from '@nestjs/common';
import { KycOcrStatus } from './entities/kyc-verification.entity';

export interface KycOcrResult {
  status: KycOcrStatus;
  confidence: number | null;
  payload: Record<string, unknown>;
}

@Injectable()
export class KycOcrService {
  async extractIdentity(filePath: string): Promise<KycOcrResult> {
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

    let worker: { recognize: (filePath: string) => Promise<any>; terminate: () => Promise<unknown> } | null = null;
    let workerError: string | null = null;
    try {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('vie+eng', undefined, {
        errorHandler: (error: unknown) => {
          workerError = this.normalizeError(error);
        },
      });
      const result = await this.withTimeout(
        worker.recognize(filePath),
        this.timeoutMs(),
      );

      const text = result.data.text || '';
      return {
        status: KycOcrStatus.COMPLETED,
        confidence: Math.round(result.data.confidence || 0),
        payload: {
          rawText: text,
          idNumber: this.extractIdNumber(text),
          dateOfBirth: this.extractDateOfBirth(text),
        },
      };
    } catch (error) {
      return {
        status: KycOcrStatus.FAILED,
        confidence: null,
        payload: {
          error: error instanceof Error ? error.message : workerError ?? 'OCR failed',
        },
      };
    } finally {
      if (worker) {
        await worker.terminate().catch(() => undefined);
      }
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`OCR timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }

  private timeoutMs(): number {
    const value = Number(process.env.KYC_OCR_TIMEOUT_MS);
    return Number.isFinite(value) && value > 0 ? value : 30000;
  }

  private normalizeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'OCR worker failed';
  }

  private extractIdNumber(text: string): string | null {
    return text.match(/\b\d{9,12}\b/)?.[0] ?? null;
  }

  private extractDateOfBirth(text: string): string | null {
    const match = text.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
    if (!match) return null;
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
}
