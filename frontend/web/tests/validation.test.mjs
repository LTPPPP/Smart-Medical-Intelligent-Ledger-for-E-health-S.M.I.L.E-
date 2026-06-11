import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isFutureDateTime,
  isValidDateRange,
  isValidImageUpload,
  isValidVietnamesePhone,
  normalizeOptionalText,
} from '../src/shared/lib/validation.ts';

test('accepts common Vietnamese mobile phone formats', () => {
  assert.equal(isValidVietnamesePhone('0912345678'), true);
  assert.equal(isValidVietnamesePhone('+84912345678'), true);
  assert.equal(isValidVietnamesePhone('84 912 345 678'), true);
  assert.equal(isValidVietnamesePhone('0812345'), false);
});

test('requires appointment date and time to be in the future', () => {
  const now = new Date('2026-06-12T10:00:00+07:00');

  assert.equal(isFutureDateTime('2026-06-12', '10:30', now), true);
  assert.equal(isFutureDateTime('2026-06-12', '09:30', now), false);
  assert.equal(isFutureDateTime('', '10:30', now), false);
});

test('validates chronological date ranges', () => {
  assert.equal(
    isValidDateRange('2026-06-12T09:00:00+07:00', '2026-06-12T17:00:00+07:00'),
    true,
  );
  assert.equal(
    isValidDateRange('2026-06-12T17:00:00+07:00', '2026-06-12T09:00:00+07:00'),
    false,
  );
});

test('normalizes optional text and enforces a minimum when present', () => {
  assert.equal(normalizeOptionalText('   '), undefined);
  assert.equal(normalizeOptionalText('  patient requested leave  ', 5), 'patient requested leave');
  assert.equal(normalizeOptionalText('no', 5), undefined);
});

test('accepts supported dental images within the configured size', () => {
  assert.deepEqual(
    isValidImageUpload({ type: 'image/jpeg', size: 2_000_000 }, 5_000_000),
    { valid: true },
  );
  assert.deepEqual(
    isValidImageUpload({ type: 'application/pdf', size: 2_000_000 }, 5_000_000),
    { valid: false, reason: 'Unsupported file type.' },
  );
  assert.deepEqual(
    isValidImageUpload({ type: 'image/png', size: 6_000_000 }, 5_000_000),
    { valid: false, reason: 'File size exceeds 5 MB.' },
  );
});
