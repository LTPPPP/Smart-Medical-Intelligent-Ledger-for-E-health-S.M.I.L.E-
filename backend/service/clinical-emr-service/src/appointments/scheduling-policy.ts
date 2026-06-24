export const ARRIVAL_GRACE_MINUTES = 15;
export const DOCTOR_BREAK_MINUTES = 10;
export const SLOT_STEP_MINUTES = 15;

export interface OccupiedInterval {
  start: Date;
  careStart: Date;
  end: Date;
}

const MINUTE_MS = 60_000;

function parseTime(value: string): number {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) {
    throw new Error('Time must use HH:mm format.');
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new Error('Time must use HH:mm format.');
  }
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * MINUTE_MS);
}

export function buildOccupiedInterval(
  date: string,
  time: string,
  serviceDurationMinutes: number,
): OccupiedInterval {
  if (!Number.isInteger(serviceDurationMinutes) || serviceDurationMinutes <= 0) {
    throw new Error('Service duration must be positive.');
  }
  const startMinutes = parseTime(time);
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Date must use YYYY-MM-DD format.');
  }
  start.setMinutes(startMinutes);
  const careStart = addMinutes(start, ARRIVAL_GRACE_MINUTES);
  const end = addMinutes(
    careStart,
    serviceDurationMinutes + DOCTOR_BREAK_MINUTES,
  );
  return { start, careStart, end };
}

export function generateCandidateStarts(
  shiftStart: string,
  shiftEnd: string,
  serviceDurationMinutes: number,
): string[] {
  if (!Number.isInteger(serviceDurationMinutes) || serviceDurationMinutes <= 0) {
    throw new Error('Service duration must be positive.');
  }
  const start = parseTime(shiftStart);
  const end = parseTime(shiftEnd);
  const occupiedMinutes =
    ARRIVAL_GRACE_MINUTES + serviceDurationMinutes + DOCTOR_BREAK_MINUTES;
  const result: string[] = [];
  for (
    let candidate = start;
    candidate + occupiedMinutes <= end;
    candidate += SLOT_STEP_MINUTES
  ) {
    result.push(formatTime(candidate));
  }
  return result;
}

export function overlaps(
  left: OccupiedInterval,
  right: OccupiedInterval,
): boolean {
  return left.start < right.end && right.start < left.end;
}
