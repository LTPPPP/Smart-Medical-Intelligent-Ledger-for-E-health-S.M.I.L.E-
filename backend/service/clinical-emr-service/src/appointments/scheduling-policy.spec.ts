import {
  buildOccupiedInterval,
  generateCandidateStarts,
  overlaps,
} from './scheduling-policy';

describe('appointment scheduling policy', () => {
  it('should add arrival grace, service duration, and doctor break', () => {
    const interval = buildOccupiedInterval('2026-06-30', '09:00', 60);

    expect([interval.start.getHours(), interval.start.getMinutes()]).toEqual([
      9, 0,
    ]);
    expect([
      interval.careStart.getHours(),
      interval.careStart.getMinutes(),
    ]).toEqual([9, 15]);
    expect([interval.end.getHours(), interval.end.getMinutes()]).toEqual([
      10, 25,
    ]);
  });

  it('should generate 15-minute starts whose full occupied interval fits the shift', () => {
    expect(generateCandidateStarts('09:00', '12:00', 150)).toEqual(['09:00']);
  });

  it('should use half-open intervals so an appointment may start at the prior end', () => {
    const first = buildOccupiedInterval('2026-06-30', '09:00', 60);
    const adjacent = buildOccupiedInterval('2026-06-30', '10:25', 30);

    expect(overlaps(first, adjacent)).toBe(false);
  });

  it('should reject non-positive service durations', () => {
    expect(() => buildOccupiedInterval('2026-06-30', '09:00', 0)).toThrow(
      'Service duration must be positive.',
    );
  });
});
