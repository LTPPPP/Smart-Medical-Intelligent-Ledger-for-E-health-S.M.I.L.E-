import { describe, expect, it } from 'vitest';

import { formatKycConfidence, summarizeKycChecks } from './kyc-management';

describe('kyc-management helpers', () => {
  it('falls back to confidence stored inside OCR payload', () => {
    expect(formatKycConfidence({ status: 'PENDING_REVIEW', ocrConfidence: null, ocrPayload: { confidence: 0.91 } })).toBe('91%');
    expect(formatKycConfidence({ status: 'PENDING_REVIEW', ocrPayload: { confidence: 87 } })).toBe('87%');
  });

  it('summarizes pass, fail, and warning checks with reasons', () => {
    const summary = summarizeKycChecks([
      { label: 'ID number', status: 'PASS', message: 'Matched submitted ID.' },
      { label: 'Date of birth', status: 'FAIL', message: 'OCR date differs.' },
      { label: 'Confidence', status: 'WARNING', message: 'Manual review recommended.' },
    ]);

    expect(summary.pass.count).toBe(1);
    expect(summary.fail.reasons).toContain('Date of birth: OCR date differs.');
    expect(summary.warn.reasons).toContain('Confidence: Manual review recommended.');
  });
});
