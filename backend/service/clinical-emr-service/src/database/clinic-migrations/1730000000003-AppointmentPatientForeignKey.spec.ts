import { AppointmentPatientForeignKey1730000000003 } from './1730000000003-AppointmentPatientForeignKey';

describe('AppointmentPatientForeignKey migration', () => {
  it('should add an authoritative appointment patient foreign key', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValue(undefined);
    const migration = new AppointmentPatientForeignKey1730000000003();

    await migration.up({ query } as any);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('appointments_patient_id_fkey');
    expect(sql).toContain('FOREIGN KEY ("patient_id")');
    expect(sql).toContain('REFERENCES "patients"("patient_id")');
    expect(sql).toContain('ON DELETE RESTRICT');
    expect(sql).toContain('NOT VALID');
    expect(sql).toContain('VALIDATE CONSTRAINT "appointments_patient_id_fkey"');
  });

  it('should skip the foreign key when patients live in another database', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ exists: false }]);
    const migration = new AppointmentPatientForeignKey1730000000003();

    await migration.up({ query } as any);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('information_schema.tables');
    expect(sql).not.toContain('ADD CONSTRAINT "appointments_patient_id_fkey"');
  });

  it('should remove the appointment patient foreign key on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AppointmentPatientForeignKey1730000000003();

    await migration.down({ query } as any);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain(
      'DROP CONSTRAINT IF EXISTS "appointments_patient_id_fkey"',
    );
  });
});
