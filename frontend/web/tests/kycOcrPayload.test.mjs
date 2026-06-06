import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAdditionalOcrFields,
  getTechnicalOcrPayload,
} from '../src/features/admin/utils/kycOcrPayload.ts';

test('additional OCR fields include only useful scalar values', () => {
  const payload = {
    provider: 'paddleocr',
    issueDate: '22/11/2021',
    idNumber: '087204009012',
    rawText: 'raw content',
    checks: [],
    front: { lines: [{ text: 'large nested data' }] },
  };

  assert.deepEqual(getAdditionalOcrFields(payload), [
    { label: 'Provider', value: 'paddleocr' },
    { label: 'Issue date', value: '22/11/2021' },
  ]);
});

test('technical OCR payload excludes values already presented to reviewers', () => {
  const payload = {
    provider: 'paddleocr',
    issueDate: '22/11/2021',
    idNumber: '087204009012',
    fullName: 'TRAN DAI NHAN',
    dateOfBirth: '08/10/2004',
    rawText: 'raw content',
    riskLevel: 'LOW',
    riskReason: 'No high-risk signal.',
    checks: [],
    front: { lines: [{ text: 'front line' }] },
    back: { lines: [{ text: 'back line' }] },
  };

  assert.deepEqual(getTechnicalOcrPayload(payload), {
    front: { lines: [{ text: 'front line' }] },
    back: { lines: [{ text: 'back line' }] },
  });
});
