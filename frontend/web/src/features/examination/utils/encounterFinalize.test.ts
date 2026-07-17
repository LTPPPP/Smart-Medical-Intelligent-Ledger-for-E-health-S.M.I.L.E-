import { describe, expect, it } from 'vitest';

import { getFinalizeEncounterBlocker } from './encounterFinalize';

describe('getFinalizeEncounterBlocker', () => {
  it('requires an in-progress encounter', () => {
    expect(
      getFinalizeEncounterBlocker({
        status: 'scheduled',
        clinicalNotes: ['Tooth pain'],
        diagnosisCount: 1,
      }),
    ).toBe('Only in-progress encounters can be finalized.');
  });

  it('requires a minimum clinical note', () => {
    expect(
      getFinalizeEncounterBlocker({
        status: 'in_progress',
        clinicalNotes: [' ', null],
        diagnosisCount: 1,
      }),
    ).toBe('Add a clinical note before finalizing.');
  });

  it('requires at least one diagnosis', () => {
    expect(
      getFinalizeEncounterBlocker({
        status: 'in_progress',
        clinicalNotes: ['Tooth pain'],
        diagnosisCount: 0,
      }),
    ).toBe('Add at least one diagnosis before finalizing.');
  });

  it('allows a ready encounter', () => {
    expect(
      getFinalizeEncounterBlocker({
        status: 'in_progress',
        clinicalNotes: ['Tooth pain'],
        diagnosisCount: 1,
      }),
    ).toBeNull();
  });
});
