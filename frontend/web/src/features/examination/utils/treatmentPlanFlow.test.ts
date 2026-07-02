import { describe, expect, it } from 'vitest';

import { validateTreatmentPlanForm } from './treatmentPlanFlow';

describe('doctor treatment plan flow rules', () => {
  it('requires a treatment plan name', () => {
    expect(
      validateTreatmentPlanForm({
        plan_name: ' ',
        duration_weeks: null,
        estimated_cost: '',
        quote_currency: 'VND',
      }),
    ).toBe('Plan name is required.');
  });

  it('requires positive whole duration when provided', () => {
    expect(
      validateTreatmentPlanForm({
        plan_name: 'Implant plan',
        duration_weeks: 0,
        estimated_cost: '',
        quote_currency: 'VND',
      }),
    ).toBe('Duration must be a positive whole number.');
  });

  it('requires positive quote amount when provided', () => {
    expect(
      validateTreatmentPlanForm({
        plan_name: 'Implant plan',
        duration_weeks: 8,
        estimated_cost: '0',
        quote_currency: 'VND',
      }),
    ).toBe('Estimated cost must be a positive amount.');
  });

  it('requires three-letter quote currency', () => {
    expect(
      validateTreatmentPlanForm({
        plan_name: 'Implant plan',
        duration_weeks: 8,
        estimated_cost: '12000000',
        quote_currency: 'VN',
      }),
    ).toBe('Currency must use a three-letter code.');
  });

  it('allows valid draft treatment plan details', () => {
    expect(
      validateTreatmentPlanForm({
        plan_name: 'Implant plan',
        duration_weeks: 8,
        estimated_cost: '12000000',
        quote_currency: 'VND',
      }),
    ).toBeNull();
  });
});
