import {
  SCHEDULE_FUTURE_DAYS,
  SCHEDULE_PAST_DAYS,
  getSeedScheduleDates,
} from './clinic-seed-schedules';

describe('getSeedScheduleDates', () => {
  it('covers the requested deterministic window and excludes Sundays', () => {
    const dates = getSeedScheduleDates(
      new Date('2026-07-29T00:00:00.000Z'),
    );

    expect(SCHEDULE_PAST_DAYS).toBe(14);
    expect(SCHEDULE_FUTURE_DAYS).toBe(90);
    expect(dates[0]?.toISOString().slice(0, 10)).toBe('2026-07-15');
    expect(dates.at(-1)?.toISOString().slice(0, 10)).toBe('2026-10-27');
    expect(dates).toHaveLength(90);
    expect(dates.every((date) => date.getUTCDay() !== 0)).toBe(true);
  });
});
