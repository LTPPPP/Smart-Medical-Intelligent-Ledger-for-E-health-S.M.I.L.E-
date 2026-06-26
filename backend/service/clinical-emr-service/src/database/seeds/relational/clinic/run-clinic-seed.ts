import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres' as const,
  host:
    process.env.CLINIC_DATABASE_HOST ||
    process.env.DATABASE_HOST ||
    'localhost',
  port: parseInt(
    process.env.CLINIC_DATABASE_PORT || process.env.DATABASE_PORT || '5432',
    10,
  ),
  username:
    process.env.CLINIC_DATABASE_USERNAME ||
    process.env.DATABASE_USERNAME ||
    'postgres',
  password:
    process.env.CLINIC_DATABASE_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    'postgres',
  database: process.env.CLINIC_DATABASE_NAME || 'core_clinic_service_db',
  synchronize: false,
  logging: false,
});

// Patients & medical records live in the MEDICAL database (separate from the
// clinic database above). Appointments reference patient_id with no cross-DB FK,
// so we seed patients here via a dedicated connection.
const medicalDataSource = new DataSource({
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'core_medical_service_db',
  synchronize: false,
  logging: false,
});

async function runClinicSeed() {
  console.log('🌱 Running clinic-service seeds...');

  try {
    await dataSource.initialize();
    await medicalDataSource.initialize();

    // ─── Seed Clinics ───
    const CLINIC_HCM = 'c0000000-0000-0000-0000-000000000001';
    const CLINIC_HN = 'c0000000-0000-0000-0000-000000000002';

    const clinics = [
      {
        clinic_id: CLINIC_HCM,
        clinic_name: 'Nha Khoa S.M.I.L.E - Hồ Chí Minh',
        clinic_code: 'SMILE-HCM',
        address: '123 Nguyễn Huệ, Phường Bến Nghé',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        phone: '028-1234-5678',
        email: 'hcm@smile.vn',
        operating_hours: JSON.stringify({
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '08:00', close: '17:00' },
          sunday: { open: '09:00', close: '12:00' },
        }),
        license_number: 'HCM-NK-2024-001',
      },
      {
        clinic_id: CLINIC_HN,
        clinic_name: 'Nha Khoa S.M.I.L.E - Hà Nội',
        clinic_code: 'SMILE-HN',
        address: '456 Trần Hưng Đạo, Phường Cửa Nam',
        ward: 'Cửa Nam',
        district: 'Hoàn Kiếm',
        city: 'Hà Nội',
        phone: '024-9876-5432',
        email: 'hanoi@smile.vn',
        operating_hours: JSON.stringify({
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '08:00', close: '17:00' },
          sunday: null,
        }),
        license_number: 'HN-NK-2024-001',
      },
    ];

    for (const clinic of clinics) {
      await dataSource.query(
        `INSERT INTO clinics (clinic_id, clinic_name, clinic_code, address, ward, district, city, phone, email, operating_hours, license_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
         ON CONFLICT (clinic_code) DO NOTHING`,
        [
          clinic.clinic_id,
          clinic.clinic_name,
          clinic.clinic_code,
          clinic.address,
          clinic.ward,
          clinic.district,
          clinic.city,
          clinic.phone,
          clinic.email,
          clinic.operating_hours,
          clinic.license_number,
        ],
      );
    }
    console.log('  ✅ Clinics seeded');

    const clinicRows: Array<{ clinic_id: string; clinic_code: string }> =
      await dataSource.query(
        `SELECT clinic_id, clinic_code FROM clinics WHERE clinic_code IN ('SMILE-HCM', 'SMILE-HN')`,
      );
    const clinicByCode: Record<string, string> = {};
    for (const r of clinicRows) clinicByCode[r.clinic_code] = r.clinic_id;
    const HCM = clinicByCode['SMILE-HCM'] || CLINIC_HCM;
    const HN = clinicByCode['SMILE-HN'] || CLINIC_HN;

    // ─── Seed Treatment Rooms ───
    const rooms = [
      {
        clinic_id: HCM,
        room_name: 'Phòng Khám 1',
        room_code: 'PK-01',
        room_type: 'examination',
        floor_number: 1,
      },
      {
        clinic_id: HCM,
        room_name: 'Phòng Phẫu Thuật 1',
        room_code: 'PT-01',
        room_type: 'surgery',
        floor_number: 2,
      },
      {
        clinic_id: HCM,
        room_name: 'Phòng X-Quang',
        room_code: 'XQ-01',
        room_type: 'imaging',
        floor_number: 1,
      },
      {
        clinic_id: HN,
        room_name: 'Phòng Khám 1',
        room_code: 'PK-01',
        room_type: 'examination',
        floor_number: 1,
      },
    ];

    for (const room of rooms) {
      await dataSource.query(
        `INSERT INTO treatment_rooms (clinic_id, room_name, room_code, room_type, floor_number)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (clinic_id, room_code) DO NOTHING`,
        [
          room.clinic_id,
          room.room_name,
          room.room_code,
          room.room_type,
          room.floor_number,
        ],
      );
    }
    console.log('  ✅ Treatment Rooms seeded');

    // ─── Seed Specialties ───
    // specialty_id is auto-generated; later inserts resolve it by specialty_code
    // so this stays idempotent even if rows already exist with other ids.
    const specialties = [
      {
        specialty_code: 'GENERAL',
        specialty_name: 'Nha khoa tổng quát',
        description: 'Khám và điều trị răng miệng tổng quát (General Dentistry)',
        display_order: 1,
      },
      {
        specialty_code: 'ORTHO',
        specialty_name: 'Chỉnh nha',
        description: 'Niềng răng, chỉnh hình răng (Orthodontics)',
        display_order: 2,
      },
      {
        specialty_code: 'ENDO',
        specialty_name: 'Nội nha',
        description: 'Điều trị tủy răng (Endodontics)',
        display_order: 3,
      },
      {
        specialty_code: 'PERIO',
        specialty_name: 'Nha chu',
        description: 'Điều trị bệnh nha chu (Periodontics)',
        display_order: 4,
      },
      {
        specialty_code: 'SURGERY',
        specialty_name: 'Phẫu thuật hàm mặt',
        description: 'Tiểu phẫu, nhổ răng khôn, cấy ghép (Oral Surgery)',
        display_order: 5,
      },
      {
        specialty_code: 'COSMETIC',
        specialty_name: 'Nha khoa thẩm mỹ',
        description: 'Bọc sứ, tẩy trắng, dán veneer',
        display_order: 6,
      },
    ];

    for (const spec of specialties) {
      await dataSource.query(
        `INSERT INTO specialties (specialty_name, specialty_code, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (specialty_code) DO UPDATE SET
           specialty_name = EXCLUDED.specialty_name,
           description = EXCLUDED.description,
           display_order = EXCLUDED.display_order`,
        [
          spec.specialty_name,
          spec.specialty_code,
          spec.description,
          spec.display_order,
        ],
      );
    }
    console.log('  ✅ Specialties seeded');

    // ─── Seed Service Categories ───
    const categories = [
      {
        category_id: 'b0000000-0000-0000-0000-000000000001',
        category_name: 'Khám & Tư vấn',
        description: 'Dịch vụ khám và tư vấn',
        display_order: 1,
      },
      {
        category_id: 'b0000000-0000-0000-0000-000000000002',
        category_name: 'Điều trị',
        description: 'Dịch vụ điều trị nha khoa',
        display_order: 2,
      },
      {
        category_id: 'b0000000-0000-0000-0000-000000000003',
        category_name: 'Phẫu thuật',
        description: 'Dịch vụ phẫu thuật nha khoa',
        display_order: 3,
      },
    ];

    for (const cat of categories) {
      await dataSource.query(
        `INSERT INTO service_categories (category_id, category_name, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (category_id) DO NOTHING`,
        [
          cat.category_id,
          cat.category_name,
          cat.description,
          cat.display_order,
        ],
      );
    }
    console.log('  ✅ Service Categories seeded');

    // ─── Seed Services ───
    // Fixed service_id UUIDs + linked specialty_id so appointments can reference
    // real services and the revenue report (joins services.base_price) renders
    // a spread of values across `by_service`.
    const services = [
      {
        service_id: 'a2000000-0000-0000-0000-000000000001',
        service_code: 'KHAM-TQ',
        service_name: 'Khám tổng quát',
        category_id: 'b0000000-0000-0000-0000-000000000001',
        specialty_code: 'GENERAL',
        required_room_type: 'examination',
        duration: 30,
        price: 200000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000002',
        service_code: 'TU-VAN',
        service_name: 'Tư vấn điều trị',
        category_id: 'b0000000-0000-0000-0000-000000000001',
        specialty_code: 'GENERAL',
        required_room_type: 'examination',
        duration: 20,
        price: 100000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000003',
        service_code: 'CAO-VR',
        service_name: 'Cạo vôi răng',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'PERIO',
        required_room_type: 'examination',
        duration: 45,
        price: 300000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000004',
        service_code: 'TRAM-R',
        service_name: 'Trám răng',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'GENERAL',
        required_room_type: 'examination',
        duration: 60,
        price: 500000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000005',
        service_code: 'DIEU-TRI-TUY',
        service_name: 'Điều trị tủy răng',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'ENDO',
        required_room_type: 'examination',
        duration: 90,
        price: 1200000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000006',
        service_code: 'NHO-R',
        service_name: 'Nhổ răng',
        category_id: 'b0000000-0000-0000-0000-000000000003',
        specialty_code: 'SURGERY',
        required_room_type: 'surgery',
        duration: 45,
        price: 800000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000007',
        service_code: 'TAY-T',
        service_name: 'Tẩy trắng răng',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'COSMETIC',
        required_room_type: 'examination',
        duration: 90,
        price: 3000000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000008',
        service_code: 'BOC-SU',
        service_name: 'Bọc răng sứ',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'COSMETIC',
        required_room_type: 'examination',
        duration: 120,
        price: 5000000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000009',
        service_code: 'IMPLANT',
        service_name: 'Cấy ghép Implant',
        category_id: 'b0000000-0000-0000-0000-000000000003',
        specialty_code: 'SURGERY',
        required_room_type: 'surgery',
        duration: 120,
        price: 15000000,
      },
      {
        service_id: 'a2000000-0000-0000-0000-000000000010',
        service_code: 'NIENG-R',
        service_name: 'Niềng răng',
        category_id: 'b0000000-0000-0000-0000-000000000002',
        specialty_code: 'ORTHO',
        required_room_type: 'examination',
        duration: 90,
        price: 30000000,
      },
    ];

    // Resolve specialty_id per code (specialties were upserted above; an older
    // run may have given them auto-generated ids, so look them up by code).
    const svcSpecialtyRows: Array<{
      specialty_id: string;
      specialty_code: string;
    }> = await dataSource.query(
      `SELECT specialty_id, specialty_code FROM specialties`,
    );
    const svcSpecialtyByCode: Record<string, string> = {};
    for (const r of svcSpecialtyRows)
      svcSpecialtyByCode[r.specialty_code] = r.specialty_id;

    for (const svc of services) {
      await dataSource.query(
        `INSERT INTO services (service_id, service_code, service_name, category_id, specialty_id, required_room_type, duration_minutes, base_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (service_code) DO UPDATE SET
           service_name = EXCLUDED.service_name,
           category_id = EXCLUDED.category_id,
           specialty_id = EXCLUDED.specialty_id,
           required_room_type = EXCLUDED.required_room_type,
           duration_minutes = EXCLUDED.duration_minutes,
           base_price = EXCLUDED.base_price`,
        [
          svc.service_id,
          svc.service_code,
          svc.service_name,
          svc.category_id,
          svcSpecialtyByCode[svc.specialty_code] || null,
          svc.required_room_type,
          svc.duration,
          svc.price,
        ],
      );
    }
    console.log('  ✅ Services seeded');

    // ─── Seed Work Shifts ───
    const shifts = [
      {
        shift_id: 'd0000000-0000-0000-0000-000000000001',
        shift_name: 'Ca sáng',
        start_time: '08:00',
        end_time: '12:00',
        description: 'Ca làm việc buổi sáng',
      },
      {
        shift_id: 'd0000000-0000-0000-0000-000000000002',
        shift_name: 'Ca chiều',
        start_time: '13:00',
        end_time: '17:00',
        description: 'Ca làm việc buổi chiều',
      },
      {
        shift_id: 'd0000000-0000-0000-0000-000000000003',
        shift_name: 'Ca tối',
        start_time: '17:30',
        end_time: '20:00',
        description: 'Ca làm việc buổi tối',
      },
    ];

    for (const shift of shifts) {
      await dataSource.query(
        `INSERT INTO work_shifts (shift_id, shift_name, start_time, end_time, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (shift_id) DO NOTHING`,
        [
          shift.shift_id,
          shift.shift_name,
          shift.start_time,
          shift.end_time,
          shift.description,
        ],
      );
    }
    console.log('  ✅ Work Shifts seeded');

    // ═══════════════════════════════════════════════════════════════════
    //  DEMO / TEST DATA  — doctors, patients, schedules, medical records
    //  and appointments so every UI screen (dashboards + the new
    //  /admin/revenue-reports charts) renders with realistic data.
    //
    //  All inserts below are idempotent (fixed UUIDs + ON CONFLICT) and use
    //  deterministic data so re-runs are stable. doctor_id / patient.user_id
    //  reference the IAM account UUIDs created by iam-service seeds.
    // ═══════════════════════════════════════════════════════════════════

    // IAM account UUIDs (mirrors iam-service run-seed.ts)
    const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
    const DOCTOR1_ID = '550e8400-e29b-41d4-a716-446655440001';
    const DOCTOR2_ID = '550e8400-e29b-41d4-a716-446655440002';
    const PATIENT1_ACCOUNT = '550e8400-e29b-41d4-a716-446655440004';
    const PATIENT2_ACCOUNT = '550e8400-e29b-41d4-a716-446655440005';

    // Resolve the *actual* service_id per service_code from the DB. An older
    // run may have inserted these rows with auto-generated UUIDs, so we look
    // them up instead of trusting the fixed UUIDs above.
    const serviceRows: Array<{ service_id: string; service_code: string }> =
      await dataSource.query(`SELECT service_id, service_code FROM services`);
    const serviceByCode: Record<string, string> = {};
    for (const r of serviceRows) serviceByCode[r.service_code] = r.service_id;

    // Resolve specialty_id per specialty_code (an older run may have inserted
    // these with auto-generated UUIDs, so look up the real ids before linking).
    const specialtyRows: Array<{ specialty_id: string; specialty_code: string }> =
      await dataSource.query(
        `SELECT specialty_id, specialty_code FROM specialties`,
      );
    const specialtyByCode: Record<string, string> = {};
    for (const r of specialtyRows)
      specialtyByCode[r.specialty_code] = r.specialty_id;

    // ─── Doctor ⇄ Specialty links ───
    const doctorSpecialties = [
      {
        doctor_id: DOCTOR1_ID,
        specialty_id: specialtyByCode['GENERAL'],
        is_primary: true,
        certification_number: 'CERT-D1-GEN',
      },
      {
        doctor_id: DOCTOR1_ID,
        specialty_id: specialtyByCode['ENDO'],
        is_primary: false,
        certification_number: 'CERT-D1-ENDO',
      },
      {
        doctor_id: DOCTOR2_ID,
        specialty_id: specialtyByCode['ORTHO'],
        is_primary: true,
        certification_number: 'CERT-D2-ORTHO',
      },
      {
        doctor_id: DOCTOR2_ID,
        specialty_id: specialtyByCode['SURGERY'],
        is_primary: false,
        certification_number: 'CERT-D2-SURG',
      },
    ].filter((ds) => ds.specialty_id);

    for (const ds of doctorSpecialties) {
      await dataSource.query(
        `INSERT INTO doctor_specialties (doctor_id, specialty_id, certification_number, is_primary)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (doctor_id, specialty_id) DO UPDATE SET
           certification_number = EXCLUDED.certification_number,
           is_primary = EXCLUDED.is_primary`,
        [ds.doctor_id, ds.specialty_id, ds.certification_number, ds.is_primary],
      );
    }
    console.log('  ✅ Doctor Specialties seeded');

    // ─── Doctor Schedules — next 14 days (morning + afternoon shifts) ───
    const SHIFT_MORNING = 'd0000000-0000-0000-0000-000000000001';
    const SHIFT_AFTERNOON = 'd0000000-0000-0000-0000-000000000002';

    const toDateStr = (d: Date): string => d.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduleDoctors = [
      { doctor_id: DOCTOR1_ID, clinic_id: HCM },
      { doctor_id: DOCTOR2_ID, clinic_id: HN },
    ];

    let scheduleCount = 0;
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const workDate = new Date(today);
      workDate.setDate(today.getDate() + dayOffset);
      const dow = workDate.getDay(); // 0 = Sunday
      if (dow === 0) continue; // clinics closed-ish on Sunday for demo
      for (const sd of scheduleDoctors) {
        for (const shiftId of [SHIFT_MORNING, SHIFT_AFTERNOON]) {
          await dataSource.query(
            `INSERT INTO doctor_schedules (doctor_id, clinic_id, shift_id, work_date, max_patients, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (doctor_id, work_date, shift_id) DO UPDATE SET
               clinic_id = EXCLUDED.clinic_id,
               max_patients = EXCLUDED.max_patients,
               status = EXCLUDED.status`,
            [sd.doctor_id, sd.clinic_id, shiftId, toDateStr(workDate), 20, 'scheduled'],
          );
          scheduleCount++;
        }
      }
    }
    console.log(`  ✅ Doctor Schedules seeded (${scheduleCount} rows, next 14 days)`);

    // ─── Patients (5) — first two linked to IAM patient accounts ───
    const patients = [
      {
        patient_id: 'a3000000-0000-0000-0000-000000000001',
        user_id: PATIENT1_ACCOUNT,
        patient_code: 'PT-000001',
        full_name: 'Nguyễn Văn An',
        date_of_birth: '1990-04-12',
        gender: 'male',
        phone: '0901000001',
        email: 'patient1@smile.com',
        city: 'Hồ Chí Minh',
        blood_type: 'O+',
      },
      {
        patient_id: 'a3000000-0000-0000-0000-000000000002',
        user_id: PATIENT2_ACCOUNT,
        patient_code: 'PT-000002',
        full_name: 'Trần Thị Bình',
        date_of_birth: '1995-09-23',
        gender: 'female',
        phone: '0901000002',
        email: 'patient2@smile.com',
        city: 'Hà Nội',
        blood_type: 'A+',
      },
      {
        patient_id: 'a3000000-0000-0000-0000-000000000003',
        user_id: null,
        patient_code: 'PT-000003',
        full_name: 'Lê Hoàng Cường',
        date_of_birth: '1988-01-30',
        gender: 'male',
        phone: '0901000003',
        email: 'cuong.le@example.com',
        city: 'Hồ Chí Minh',
        blood_type: 'B+',
      },
      {
        patient_id: 'a3000000-0000-0000-0000-000000000004',
        user_id: null,
        patient_code: 'PT-000004',
        full_name: 'Phạm Thị Dung',
        date_of_birth: '2000-07-15',
        gender: 'female',
        phone: '0901000004',
        email: 'dung.pham@example.com',
        city: 'Hà Nội',
        blood_type: 'AB+',
      },
      {
        patient_id: 'a3000000-0000-0000-0000-000000000005',
        user_id: null,
        patient_code: 'PT-000005',
        full_name: 'Võ Minh Em',
        date_of_birth: '1975-12-02',
        gender: 'male',
        phone: '0901000005',
        email: 'em.vo@example.com',
        city: 'Hồ Chí Minh',
        blood_type: 'O-',
      },
    ];

    for (const p of patients) {
      await medicalDataSource.query(
        `INSERT INTO patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, city, blood_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (patient_code) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           full_name = EXCLUDED.full_name,
           date_of_birth = EXCLUDED.date_of_birth,
           gender = EXCLUDED.gender,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           city = EXCLUDED.city,
           blood_type = EXCLUDED.blood_type`,
        [
          p.patient_id,
          p.user_id,
          p.patient_code,
          p.full_name,
          p.date_of_birth,
          p.gender,
          p.phone,
          p.email,
          p.city,
          p.blood_type,
        ],
      );
    }
    console.log('  ✅ Patients seeded');

    // ─── Medical Records — a couple per patient (finalized) ───
    const patientIds = patients.map((p) => p.patient_id);
    const recordTemplates = [
      {
        chief_complaint: 'Đau răng hàm dưới',
        diagnosis: 'Sâu răng số 36',
        treatment_plan: 'Trám răng composite',
      },
      {
        chief_complaint: 'Chảy máu nướu khi đánh răng',
        diagnosis: 'Viêm nướu',
        treatment_plan: 'Cạo vôi răng, hướng dẫn vệ sinh',
      },
      {
        chief_complaint: 'Răng ố vàng',
        diagnosis: 'Nhiễm màu ngoại sinh',
        treatment_plan: 'Tẩy trắng răng',
      },
    ];

    let recordCount = 0;
    for (let pi = 0; pi < patientIds.length; pi++) {
      // 2 records per patient, dated within the last ~60 days, deterministic.
      for (let k = 0; k < 2; k++) {
        const seq = pi * 2 + k;
        const recordId = `a4000000-0000-0000-0000-0000000000${String(seq + 1).padStart(2, '0')}`;
        const tmpl = recordTemplates[seq % recordTemplates.length];
        const visit = new Date(today);
        visit.setDate(today.getDate() - (10 + seq * 5));
        const doctorId = seq % 2 === 0 ? DOCTOR1_ID : DOCTOR2_ID;
        const clinicId = seq % 2 === 0 ? HCM : HN;
        await medicalDataSource.query(
          `INSERT INTO medical_records (record_id, patient_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, record_status, finalized_at, finalized_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (record_id) DO UPDATE SET
             diagnosis = EXCLUDED.diagnosis,
             treatment_plan = EXCLUDED.treatment_plan,
             record_status = EXCLUDED.record_status`,
          [
            recordId,
            patientIds[pi],
            clinicId,
            doctorId,
            toDateStr(visit),
            tmpl.chief_complaint,
            tmpl.diagnosis,
            tmpl.treatment_plan,
            'finalized',
            new Date(visit),
            doctorId,
          ],
        );
        recordCount++;
      }
    }
    console.log(`  ✅ Medical Records seeded (${recordCount} rows)`);

    // ─── Appointments — 30 rows across last 30 days + next 14 days ───
    // Deterministic mix of status & payment_status. Completed appointments are
    // mostly `paid` (with a payment_id) so dashboards and the revenue report
    // (joins services.base_price WHERE payment_status='paid') render non-empty.
    const apptServiceCodes = [
      'KHAM-TQ',
      'CAO-VR',
      'TRAM-R',
      'DIEU-TRI-TUY',
      'NHO-R',
      'TAY-T',
      'BOC-SU',
      'IMPLANT',
      'NIENG-R',
      'TU-VAN',
    ];
    const apptTimes = ['08:30', '09:30', '10:30', '13:30', '14:30', '15:30', '16:30'];
    const doctorPool = [
      { doctor_id: DOCTOR1_ID, clinic_id: HCM },
      { doctor_id: DOCTOR2_ID, clinic_id: HN },
    ];

    const TOTAL_APPTS = 30;
    let apptCount = 0;
    let paidCount = 0;
    for (let i = 0; i < TOTAL_APPTS; i++) {
      const apptId = `a5000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`;
      const code = `APT-2026-${String(i + 1).padStart(4, '0')}`;

      // Day offset: first ~22 in the past 30 days, rest upcoming (next 14 days).
      const isUpcoming = i >= 22;
      const dayOffset = isUpcoming
        ? (i - 22) + 1 // +1 .. +8 days ahead
        : -(2 + i); // -2 .. -23 days ago (spread across last 30 days)
      const apptDate = new Date(today);
      apptDate.setDate(today.getDate() + dayOffset);

      const svcCode = apptServiceCodes[i % apptServiceCodes.length];
      const serviceId = serviceByCode[svcCode] || null;
      const doc = doctorPool[i % doctorPool.length];
      const patientId = patientIds[i % patientIds.length];
      const time = apptTimes[i % apptTimes.length];
      const appointmentDate = toDateStr(apptDate);
      const durationMinutes = 30;

      // Status / payment logic (deterministic):
      //  - upcoming  -> scheduled/confirmed, unpaid
      //  - past      -> mostly completed; some cancelled / no_show
      let status: string;
      let payment_status: string;
      let payment_id: string | null = null;
      let cancellation_reason: string | null = null;

      if (isUpcoming) {
        status = i % 2 === 0 ? 'confirmed' : 'scheduled';
        payment_status = 'unpaid';
      } else if (i % 9 === 4) {
        status = 'cancelled';
        payment_status = 'unpaid';
        cancellation_reason = 'Bệnh nhân bận đột xuất';
      } else if (i % 9 === 7) {
        status = 'no_show';
        payment_status = 'unpaid';
      } else {
        status = 'completed';
        // At least half of completed → paid (here ~80% paid).
        const paid = i % 5 !== 0;
        payment_status = paid ? 'paid' : 'unpaid';
        if (paid) {
          payment_id = `a6000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`;
          paidCount++;
        }
      }

      if (
        ['scheduled', 'confirmed', 'checked_in', 'in_progress'].includes(
          status,
        )
      ) {
        const appointmentConflicts: Array<{ appointment_code: string }> =
          await dataSource.query(
            `SELECT appointment_code
             FROM appointments
             WHERE appointment_code <> $1
               AND status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress')
               AND (doctor_id = $2 OR patient_id = $3)
               AND occupied_during && tsrange(
                 ($4::date + $5::time),
                 (($4::date + $5::time) + INTERVAL '25 minutes' + ($6::int * INTERVAL '1 minute')),
                 '[)'
               )
             LIMIT 1`,
            [
              code,
              doc.doctor_id,
              patientId,
              appointmentDate,
              time,
              durationMinutes,
            ],
          );

        if (appointmentConflicts.length > 0) {
          continue;
        }
      }

      await dataSource.query(
        `INSERT INTO appointments
           (appointment_id, appointment_code, patient_id, doctor_id, clinic_id, service_id,
            appointment_date, appointment_time, duration_minutes, appointment_type, status,
            chief_complaint, payment_status, payment_id, created_by, cancellation_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (appointment_code) DO UPDATE SET
           patient_id = EXCLUDED.patient_id,
           doctor_id = EXCLUDED.doctor_id,
           clinic_id = EXCLUDED.clinic_id,
           service_id = EXCLUDED.service_id,
           appointment_date = EXCLUDED.appointment_date,
           appointment_time = EXCLUDED.appointment_time,
           status = EXCLUDED.status,
           payment_status = EXCLUDED.payment_status,
           payment_id = EXCLUDED.payment_id,
           cancellation_reason = EXCLUDED.cancellation_reason`,
        [
          apptId,
          code,
          patientId,
          doc.doctor_id,
          doc.clinic_id,
          serviceId,
          appointmentDate,
          time,
          durationMinutes,
          'consultation',
          status,
          'Khám và điều trị nha khoa',
          payment_status,
          payment_id,
          ADMIN_ID,
          cancellation_reason,
        ],
      );
      apptCount++;
    }
    console.log(
      `  ✅ Appointments seeded (${apptCount} rows, ${paidCount} paid for revenue report)`,
    );

    console.log('🌱 Clinic-service seed completed successfully!');
  } catch (error) {
    console.error('❌ Clinic-service seed failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
    if (medicalDataSource.isInitialized) await medicalDataSource.destroy();
  }
}

runClinicSeed();
