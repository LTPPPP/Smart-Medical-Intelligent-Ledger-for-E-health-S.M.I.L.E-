import { CanonicalAppointmentAvailability1730000000002 } from './1730000000002-CanonicalAppointmentAvailability';

describe('CanonicalAppointmentAvailability migration', () => {
  it('normalizes room configuration and installs canonical resource conflicts', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new CanonicalAppointmentAvailability1730000000002();

    await migration.up({ query } as any);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('clinic_room_type');
    expect(sql).toContain('required_room_type');
    expect(sql).toContain("'SMOKE-SVC'");
    expect(sql).toContain('DROP COLUMN IF EXISTS "capacity"');
    expect(sql).toContain('occupied_during');
    expect(sql).toContain("INTERVAL '25 minutes'");
    expect(sql).toContain('appointments_doctor_occupied_excl');
    expect(sql).toContain('appointments_room_occupied_excl');
    expect(sql).toContain('appointments_patient_occupied_excl');
    expect(sql).toContain("'scheduled', 'confirmed', 'checked_in', 'in_progress'");
  });
});
