import { ClinicDataSource } from './clinic-data-source';

describe('ClinicDataSource migrations', () => {
  it('should register migration classes without loading Jest spec files', () => {
    const configured = ClinicDataSource.options.migrations;
    const migrations = Array.isArray(configured) ? configured : [];

    expect(migrations).toHaveLength(7);
    expect(
      migrations.every((migration) => typeof migration === 'function'),
    ).toBe(true);
    expect(
      migrations.map((migration) =>
        typeof migration === 'function' ? migration.name : migration,
      ),
    ).toContain('AppointmentReminderTracking1730000000005');
  });
});
