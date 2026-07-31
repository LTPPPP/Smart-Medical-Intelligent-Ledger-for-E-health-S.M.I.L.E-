export const SCHEDULE_PAST_DAYS = 14;
export const SCHEDULE_FUTURE_DAYS = 90;

export function getSeedScheduleDates(anchorDate: Date): Date[] {
  const dates: Date[] = [];

  for (
    let dayOffset = -SCHEDULE_PAST_DAYS;
    dayOffset <= SCHEDULE_FUTURE_DAYS;
    dayOffset++
  ) {
    const workDate = new Date(anchorDate);
    workDate.setUTCDate(workDate.getUTCDate() + dayOffset);
    if (workDate.getUTCDay() !== 0) dates.push(workDate);
  }

  return dates;
}
