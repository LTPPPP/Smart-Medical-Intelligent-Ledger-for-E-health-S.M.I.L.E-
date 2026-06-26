import { validate } from 'class-validator';

import { QueryAppointmentAvailabilityDto } from './query-appointment-availability.dto';

describe('QueryAppointmentAvailabilityDto', () => {
  it('accepts seeded service ids used by demo services', async () => {
    const dto = Object.assign(new QueryAppointmentAvailabilityDto(), {
      patient_id: 'a4bc71be-d127-4a91-a963-7eb2d33f1aaf',
      clinic_id: '11111111-1111-4111-8111-111111111102',
      doctor_id: '550e8400-e29b-41d4-a716-446655440001',
      service_id: 'a2000000-0000-0000-0000-000000000005',
      date_from: '2026-06-30',
      date_to: '2026-06-30',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
