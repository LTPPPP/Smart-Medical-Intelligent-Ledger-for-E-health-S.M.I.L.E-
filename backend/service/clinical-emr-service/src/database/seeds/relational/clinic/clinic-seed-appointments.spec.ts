import {
  EXAMINATION_READY_DATE,
  TOTAL_SEEDED_APPOINTMENTS,
  getExaminationReadySeedSlot,
  shouldSeedCompletedEncounter,
} from './clinic-seed-appointments';

describe('clinic appointment seed plan', () => {
  it('keeps 240 appointments with one examination-ready slot per doctor', () => {
    const slots = Array.from(
      { length: TOTAL_SEEDED_APPOINTMENTS },
      (_, index) => getExaminationReadySeedSlot(index + 1),
    ).filter((slot) => slot !== null);

    expect(TOTAL_SEEDED_APPOINTMENTS).toBe(240);
    expect(slots).toHaveLength(8);
    expect(slots.map((slot) => slot.sequence)).toEqual([
      181, 182, 183, 184, 185, 186, 187, 188,
    ]);
    expect(new Set(slots.map((slot) => slot.doctorIndex))).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7]),
    );
    expect(new Set(slots.map((slot) => slot.time))).toHaveProperty('size', 8);
    expect(
      slots.every(
        (slot) =>
          slot.date === EXAMINATION_READY_DATE && slot.status === 'checked_in',
      ),
    ).toBe(true);
    expect(
      slots.some((slot) => shouldSeedCompletedEncounter(slot.status)),
    ).toBe(false);
  });
});
