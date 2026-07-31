export const TOTAL_SEEDED_APPOINTMENTS = 240;
export const EXAMINATION_READY_DATE = '2026-08-01';
export const EXAMINATION_READY_DOCTOR_COUNT = 8;

const FIRST_EXAMINATION_READY_SEQUENCE = 181;
const EXAMINATION_READY_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
] as const;

export interface ExaminationReadySeedSlot {
  sequence: number;
  doctorIndex: number;
  date: string;
  time: (typeof EXAMINATION_READY_TIMES)[number];
  status: 'checked_in';
}

export function getExaminationReadySeedSlot(
  sequence: number,
): ExaminationReadySeedSlot | null {
  const doctorIndex = sequence - FIRST_EXAMINATION_READY_SEQUENCE;
  if (doctorIndex < 0 || doctorIndex >= EXAMINATION_READY_DOCTOR_COUNT) {
    return null;
  }

  return {
    sequence,
    doctorIndex,
    date: EXAMINATION_READY_DATE,
    time: EXAMINATION_READY_TIMES[doctorIndex],
    status: 'checked_in',
  };
}

export function shouldSeedCompletedEncounter(status: string): boolean {
  return status === 'completed';
}
