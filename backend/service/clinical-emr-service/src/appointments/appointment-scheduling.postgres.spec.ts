import { randomUUID } from 'crypto';
import { Pool } from 'pg';

const describePostgres =
  process.env.RUN_POSTGRES_INTEGRATION === 'true' ? describe : describe.skip;

describePostgres('PostgreSQL appointment scheduling constraints', () => {
  const pool = new Pool({
    host: process.env.CLINIC_DATABASE_HOST || 'localhost',
    port: Number(process.env.CLINIC_DATABASE_PORT || 5432),
    user: process.env.CLINIC_DATABASE_USERNAME || 'postgres',
    password: process.env.CLINIC_DATABASE_PASSWORD || 'postgres',
    database: process.env.CLINIC_DATABASE_NAME || 'core_clinic_service_db',
    max: 4,
  });
  const runId = randomUUID().slice(0, 8);
  const codePrefix = `E2E-${runId}`;
  const clinicId = randomUUID();
  const roomOneId = randomUUID();
  const roomTwoId = randomUUID();
  const doctorOneId = randomUUID();
  const doctorTwoId = randomUUID();
  const patientOneId = randomUUID();
  const patientTwoId = randomUUID();
  const actorId = randomUUID();
  const appointmentDate = '2099-01-15';
  let sequence = 0;

  const insertAppointment = (overrides: Record<string, unknown> = {}) => {
    sequence += 1;
    const values = {
      appointment_id: randomUUID(),
      appointment_code: `${codePrefix}-${sequence}`,
      patient_id: patientOneId,
      doctor_id: doctorOneId,
      clinic_id: clinicId,
      room_id: roomOneId,
      appointment_date: appointmentDate,
      appointment_time: '09:00',
      duration_minutes: 30,
      status: 'scheduled',
      created_by: actorId,
      ...overrides,
    };

    return pool.query(
      `INSERT INTO appointments (
        appointment_id, appointment_code, patient_id, doctor_id, clinic_id,
        room_id, appointment_date, appointment_time, duration_minutes, status,
        created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        values.appointment_id,
        values.appointment_code,
        values.patient_id,
        values.doctor_id,
        values.clinic_id,
        values.room_id,
        values.appointment_date,
        values.appointment_time,
        values.duration_minutes,
        values.status,
        values.created_by,
      ],
    );
  };

  beforeAll(async () => {
    await pool.query(
      `INSERT INTO clinics (clinic_id, clinic_name, clinic_code, address)
       VALUES ($1, $2, $3, $4)`,
      [clinicId, 'Scheduling E2E Clinic', `E2E-${runId}`, 'Local test only'],
    );
    await pool.query(
      `INSERT INTO treatment_rooms (
        room_id, clinic_id, room_name, room_code, room_type
      ) VALUES
        ($1, $3, 'E2E Room 1', $4, 'examination'),
        ($2, $3, 'E2E Room 2', $5, 'examination')`,
      [
        roomOneId,
        roomTwoId,
        clinicId,
        `E2E-R1-${runId}`,
        `E2E-R2-${runId}`,
      ],
    );
  });

  beforeEach(async () => {
    sequence = 0;
    await pool.query(`DELETE FROM appointments WHERE appointment_code LIKE $1`, [
      `${codePrefix}%`,
    ]);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM appointments WHERE appointment_code LIKE $1`, [
      `${codePrefix}%`,
    ]);
    await pool.query(`DELETE FROM treatment_rooms WHERE room_id = ANY($1::uuid[])`, [
      [roomOneId, roomTwoId],
    ]);
    await pool.query(`DELETE FROM clinics WHERE clinic_id = $1`, [clinicId]);
    await pool.end();
  });

  it('rejects overlapping appointments for the same doctor', async () => {
    await insertAppointment();

    await expect(
      insertAppointment({
        patient_id: patientTwoId,
        room_id: roomTwoId,
        appointment_time: '09:15',
      }),
    ).rejects.toMatchObject({
      code: '23P01',
      constraint: 'appointments_doctor_occupied_excl',
    });
  });

  it('rejects overlapping appointments for the same room', async () => {
    await insertAppointment();

    await expect(
      insertAppointment({
        patient_id: patientTwoId,
        doctor_id: doctorTwoId,
        appointment_time: '09:15',
      }),
    ).rejects.toMatchObject({
      code: '23P01',
      constraint: 'appointments_room_occupied_excl',
    });
  });

  it('rejects overlapping appointments for the same patient', async () => {
    await insertAppointment();

    await expect(
      insertAppointment({
        doctor_id: doctorTwoId,
        room_id: roomTwoId,
        appointment_time: '09:15',
      }),
    ).rejects.toMatchObject({
      code: '23P01',
      constraint: 'appointments_patient_occupied_excl',
    });
  });

  it('allows adjacent occupied intervals', async () => {
    await insertAppointment();

    await expect(
      insertAppointment({
        appointment_time: '09:55',
      }),
    ).resolves.toBeDefined();
  });

  it('does not let cancelled appointments block a slot', async () => {
    await insertAppointment({ status: 'cancelled' });

    await expect(insertAppointment()).resolves.toBeDefined();
  });

  it('allows exactly one concurrent commit for the same slot', async () => {
    const results = await Promise.allSettled([
      insertAppointment(),
      insertAppointment(),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    const rejected = results.find(
      (result): result is PromiseRejectedResult =>
        result.status === 'rejected',
    );
    expect(rejected?.reason).toMatchObject({ code: '23P01' });
  });
});
