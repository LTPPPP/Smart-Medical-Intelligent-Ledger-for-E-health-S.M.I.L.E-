import { describe, expect, it } from 'vitest';

import { DOCTORS, doctorName } from './scheduleConstants';

describe('schedule doctor constants', () => {
  it('matches seeded doctor profile names used by the booking chatbot', () => {
    expect(DOCTORS).toEqual([
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Dr. Nguyen Van A' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Dr. Tran Thi B' },
    ]);
    expect(doctorName('550e8400-e29b-41d4-a716-446655440002')).toBe('Dr. Tran Thi B');
  });
});
