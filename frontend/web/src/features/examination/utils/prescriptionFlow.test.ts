import { describe, expect, it } from 'vitest';

import {
  canCreatePrescription,
  canIssuePrescription,
  canModifyPrescriptionItems,
  normalizePrescriptionStatus,
  validatePrescriptionItemForm,
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

  it('allows issuing only mutable draft prescriptions with at least one item', () => {
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'draft',
        itemCount: 1,
      }),
    ).toBe(true);
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'draft',
        itemCount: 0,
      }),
    ).toBe(false);
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: 'prescription-1',
        status: 'issued',
        itemCount: 1,
      }),
    ).toBe(false);
    expect(
      canIssuePrescription({
        isFinalized: true,
        prescriptionId: 'prescription-1',
        status: 'draft',
        itemCount: 1,
      }),
    ).toBe(false);
  });

  it('requires positive integer duration and quantity when prescription item fields are provided', () => {
    expect(
      validatePrescriptionItemForm({
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        frequency: '3x/day',
        duration_days: 7,
        quantity: 21,
      }),
    ).toBeNull();
    expect(
      validatePrescriptionItemForm({
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        frequency: '3x/day',
        duration_days: 0,
        quantity: 21,
      }),
    ).toBe('Duration must be a positive whole number.');
    expect(
      validatePrescriptionItemForm({
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        frequency: '3x/day',
        duration_days: 7,
        quantity: -1,
      }),
    ).toBe('Quantity must be a positive whole number.');
  });
});
