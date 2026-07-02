import { describe, expect, it } from 'vitest';

import {
  canCreatePrescription,
  canModifyPrescriptionItems,
  normalizePrescriptionStatus,
} from './prescriptionFlow';

describe('doctor prescription flow rules', () => {
  it('normalizes backend prescription statuses to lower-case workflow states', () => {
    expect(normalizePrescriptionStatus('DRAFT')).toBe('draft');
    expect(normalizePrescriptionStatus(' issued ')).toBe('issued');
    expect(normalizePrescriptionStatus(null)).toBe('draft');
  });

  it('allows creating prescriptions only while the encounter is mutable and has a patient', () => {
    expect(canCreatePrescription({ isFinalized: false, patientId: 'patient-1' })).toBe(true);
    expect(canCreatePrescription({ isFinalized: true, patientId: 'patient-1' })).toBe(false);
    expect(canCreatePrescription({ isFinalized: false, patientId: '' })).toBe(false);
  });

  it('allows drug changes only on a selected draft prescription in a mutable encounter', () => {
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'draft',
      }),
    ).toBe(true);

    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'issued',
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'cancelled',
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: true,
        prescriptionId: 'prescription-1',
        status: 'draft',
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: null,
        status: 'draft',
      }),
    ).toBe(false);
  });
});
