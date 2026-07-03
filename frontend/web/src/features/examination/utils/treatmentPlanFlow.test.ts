import { describe, expect, it } from 'vitest';

import {
  getTreatmentPlanAcceptanceBlocker,
  getTreatmentPlanProposalBlocker,
  validateTreatmentPlanForm,
} from './treatmentPlanFlow';

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

  it('requires legal proposal details before a treatment plan is proposed', () => {
    expect(
      getTreatmentPlanProposalBlocker({
        estimated_cost: '12000000',
        quote_version: '',
        risk_disclosure: 'Pain and swelling were discussed.',
        alternative_options: 'Observation or extraction were discussed.',
      }),
    ).toBe('Quote version is required before proposing.');
    expect(
      getTreatmentPlanProposalBlocker({
        estimated_cost: '12000000',
        quote_version: 'PRICE-2026-07',
        risk_disclosure: '',
        alternative_options: 'Observation or extraction were discussed.',
      }),
    ).toBe('Risk disclosure is required before proposing.');
    expect(
      getTreatmentPlanProposalBlocker({
        estimated_cost: '12000000',
        quote_version: 'PRICE-2026-07',
        risk_disclosure: 'Pain and swelling were discussed.',
        alternative_options: '',
      }),
    ).toBe('Alternative options are required before proposing.');
  });

  it('allows a treatment plan proposal with cost, quote version, risks, and alternatives', () => {
    expect(
      getTreatmentPlanProposalBlocker({
        estimated_cost: '12000000',
        quote_version: 'PRICE-2026-07',
        risk_disclosure: 'Pain and swelling were discussed.',
        alternative_options: 'Observation or extraction were discussed.',
      }),
    ).toBeNull();
  });

  it('requires representative contact before a minor patient accepts a treatment plan', () => {
    const today = new Date('2026-07-03');

    expect(
      getTreatmentPlanAcceptanceBlocker({
        patient: {
          date_of_birth: '2015-01-01',
          emergency_contact: '',
          emergency_phone: '',
        },
        today,
      }),
    ).toBe(
      'Representative contact and phone are required before accepting a treatment plan for a minor patient.',
    );

    expect(
      getTreatmentPlanAcceptanceBlocker({
        patient: {
          date_of_birth: '1980-01-01',
          emergency_contact: '',
          emergency_phone: '',
        },
        today,
      }),
    ).toBeNull();

    expect(
      getTreatmentPlanAcceptanceBlocker({
        patient: {
          date_of_birth: '2015-01-01',
          emergency_contact: 'Nguyen Van A',
          emergency_phone: '0901234567',
        },
        today,
      }),
    ).toBeNull();
  });
});
