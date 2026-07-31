import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { ClinicDataSource } from './clinic-data-source';
import { ClinicSpecialtyEntity } from '../specialties/entities/clinic-specialty.entity';

describe('ClinicDataSource migrations', () => {
  it('should register the clinic-specialty mapping entity', () => {
    const configured = ClinicDataSource.options.entities;
    const entities = Array.isArray(configured) ? configured : [];

    expect(entities).toContain(ClinicSpecialtyEntity);
  });

  it('should register migration classes without loading Jest spec files', () => {
    const configured = ClinicDataSource.options.migrations;
    const migrations = Array.isArray(configured) ? configured : [];

    expect(migrations).toHaveLength(13);
    expect(
      migrations.every((migration) => typeof migration === 'function'),
    ).toBe(true);
    expect(
      migrations.map((migration) =>
        typeof migration === 'function' ? migration.name : migration,
      ),
    ).toContain('AppointmentReminderTracking1730000000005');
    expect(
      migrations.map((migration) =>
        typeof migration === 'function' ? migration.name : migration,
      ),
    ).toContain('AppointmentCancellationRequested1730000000012');
  });

  // This list is explicit rather than a glob, so a new migration file is silently
  // skipped until it is imported here. AddEnumCheckConstraints1730000000007 was
  // dead for exactly that reason. Assert every file on disk is registered.
  it('should register every migration file in clinic-migrations', () => {
    const files = readdirSync(join(__dirname, 'clinic-migrations'))
      .filter((f) => /\.ts$/.test(f) && !f.endsWith('.spec.ts'))
      .map((f) => f.replace(/^\d+-/, '').replace(/\.ts$/, ''));

    const configured = ClinicDataSource.options.migrations;
    const registered = (Array.isArray(configured) ? configured : []).map((m) =>
      typeof m === 'function' ? m.name.replace(/\d+$/, '') : String(m),
    );

    for (const file of files) {
      expect(registered).toContain(file);
    }
  });
});
