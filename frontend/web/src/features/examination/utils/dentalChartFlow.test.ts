import { describe, expect, it } from 'vitest';

import {
  getDentalChartFormBlocker,
  normalizeDentalChartToothNumber,
} from './dentalChartFlow';

describe('doctor dental chart flow rules', () => {
  it('normalizes valid FDI tooth numbers', () => {
    expect(normalizeDentalChartToothNumber('11')).toBe(11);
    expect(normalizeDentalChartToothNumber('18')).toBe(18);
    expect(normalizeDentalChartToothNumber('21')).toBe(21);
    expect(normalizeDentalChartToothNumber('38')).toBe(38);
    expect(normalizeDentalChartToothNumber('41')).toBe(41);
    expect(normalizeDentalChartToothNumber('48')).toBe(48);
  });

  it('rejects invalid tooth numbers', () => {
    expect(normalizeDentalChartToothNumber('10')).toBeNull();
    expect(normalizeDentalChartToothNumber('19')).toBeNull();
    expect(normalizeDentalChartToothNumber('20')).toBeNull();
    expect(normalizeDentalChartToothNumber('30')).toBeNull();
    expect(normalizeDentalChartToothNumber('40')).toBeNull();
    expect(normalizeDentalChartToothNumber('49')).toBeNull();
    expect(normalizeDentalChartToothNumber('abc')).toBeNull();
  });

  it('requires mutable encounter context before saving dental chart entries', () => {
    expect(
      getDentalChartFormBlocker({
        isFinalized: true,
        patientId: 'patient-1',
        recordId: 'record-1',
        toothNumber: '11',
      }),
    ).toBe('Finalized encounters are locked.');
    expect(
      getDentalChartFormBlocker({
        isFinalized: false,
        patientId: '',
        recordId: 'record-1',
        toothNumber: '11',
      }),
    ).toBe('Session has no patient.');
    expect(
      getDentalChartFormBlocker({
        isFinalized: false,
        patientId: 'patient-1',
        recordId: '',
        toothNumber: '11',
      }),
    ).toBe('Session has no linked medical record.');
    expect(
      getDentalChartFormBlocker({
        isFinalized: false,
        patientId: 'patient-1',
        recordId: 'record-1',
        toothNumber: '55',
      }),
    ).toBe('Enter a valid FDI tooth number: 11-18, 21-28, 31-38, or 41-48.');
  });

  it('allows valid mutable dental chart entries', () => {
    expect(
      getDentalChartFormBlocker({
        isFinalized: false,
        patientId: 'patient-1',
        recordId: 'record-1',
        toothNumber: '11',
      }),
    ).toBeNull();
  });
});
