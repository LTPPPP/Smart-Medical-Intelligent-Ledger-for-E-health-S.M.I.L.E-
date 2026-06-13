import { ConflictException } from '@nestjs/common';

import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

const TRANSITIONS: Record<string, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CHECKED_IN]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.IN_PROGRESS]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to as AppointmentStatus);
}

export function assertTransition(from: string, to: string): void {
  if (from === to) {
    throw new ConflictException(`Appointment is already '${from}'.`);
  }

  if (!canTransition(from, to)) {
    const allowed = TRANSITIONS[from] ?? [];
    throw new ConflictException(
      `Illegal status transition '${from}' to '${to}'. ` +
        (allowed.length
          ? `Allowed from '${from}': ${allowed.join(', ')}.`
          : `'${from}' is a terminal state.`),
    );
  }
}
