import { ClinicDataSource } from './clinic-data-source';

describe('ClinicDataSource migrations', () => {
  it('should register migration classes without loading Jest spec files', () => {
    const configured = ClinicDataSource.options.migrations;
    const migrations = Array.isArray(configured) ? configured : [];

    expect(migrations).toHaveLength(4);
    expect(
      migrations.every((migration) => typeof migration === 'function'),
    ).toBe(true);
  });
});
