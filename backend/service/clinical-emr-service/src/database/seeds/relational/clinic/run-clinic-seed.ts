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

function rollingDate(offsetDays: number): string {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString().split('T')[0];
}

async function runClinicSeed() {
  console.log('🌱 Running clinic-service seeds...');

  try {
    await dataSource.initialize();
    await medicalDataSource.initialize();

    // ─── Seed Clinics ───
    const clinics = [
      {
        clinic_id: '11111111-1111-4111-8111-111111111101',
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
        clinic_id: '11111111-1111-4111-8111-111111111102',
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

    // ─── Seed Treatment Rooms ───
    const rooms = [
      {
        room_id: '44444444-4444-4444-8444-444444444451',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng khám tổng quát 1',
        room_code: 'ORAL-01',
        room_type: 'examination',
        floor_number: 1,
      },
      {
        room_id: '44444444-4444-4444-8444-444444444452',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng khám tổng quát 2',
        room_code: 'ORAL-02',
        room_type: 'examination',
        floor_number: 1,
      },
      {
        room_id: null,
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng Khám 1',
        room_code: 'PK-01',
        room_type: 'examination',
        floor_number: 1,
      },
      {
        room_id: null,
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng Phẫu Thuật 1',
        room_code: 'PT-01',
        room_type: 'surgery',
        floor_number: 2,
      },
      {
        room_id: null,
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng X-Quang',
        room_code: 'XQ-01',
        room_type: 'imaging',
        floor_number: 1,
      },
      {
        room_id: null,
        clinic_id: '11111111-1111-4111-8111-111111111102',
        room_name: 'Phòng Khám 1',
        room_code: 'PK-01',
        room_type: 'examination',
        floor_number: 1,
      },
    ];

    for (const room of rooms) {
      await dataSource.query(
        `INSERT INTO treatment_rooms (room_id, clinic_id, room_name, room_code, room_type, floor_number)
         VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6)
         ON CONFLICT (clinic_id, room_code) DO UPDATE SET
           room_name = EXCLUDED.room_name,
           room_type = EXCLUDED.room_type,
           floor_number = EXCLUDED.floor_number,
           status = 'AVAILABLE'`,
        [
          room.room_id ?? null,
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
    const specialties = [
      {
        specialty_code: 'GENERAL',
        specialty_name: 'Nha khoa tổng quát',
        description: 'Khám và điều trị răng miệng tổng quát',
        display_order: 1,
      },
      {
        specialty_code: 'ORTHO',
        specialty_name: 'Chỉnh nha',
        description: 'Niềng răng, chỉnh hình răng',
        display_order: 2,
      },
      {
        specialty_code: 'IMPLANT',
        specialty_name: 'Implant nha khoa',
        description: 'Cấy ghép Implant',
        display_order: 3,
      },
      {
        specialty_code: 'COSMETIC',
        specialty_name: 'Nha khoa thẩm mỹ',
        description: 'Bọc sứ, tẩy trắng, dán veneer',
        display_order: 4,
      },
      {
        specialty_code: 'PEDIATRIC',
        specialty_name: 'Nha khoa trẻ em',
        description: 'Điều trị răng miệng cho trẻ em',
        display_order: 5,
      },
    ];

    for (const spec of specialties) {
      await dataSource.query(
        `INSERT INTO specialties (specialty_name, specialty_code, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (specialty_code) DO NOTHING`,
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
        category_id: '22222222-2222-4222-8222-222222222201',
        category_name: 'Khám & Tư vấn',
        description: 'Dịch vụ khám và tư vấn',
        display_order: 1,
      },
      {
        category_id: '22222222-2222-4222-8222-222222222202',
        category_name: 'Điều trị',
        description: 'Dịch vụ điều trị nha khoa',
        display_order: 2,
      },
      {
        category_id: '22222222-2222-4222-8222-222222222203',
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
    const services = [
      {
        service_code: 'ORAL-CHECK',
        service_name: 'Oral checking',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 30,
        price: 200000,
        room_type: 'examination',
      },
      {
        service_code: 'KHAM-TQ',
        service_name: 'Khám tổng quát',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 30,
        price: 200000,
        room_type: 'examination',
      },
      {
        service_code: 'TU-VAN',
        service_name: 'Tư vấn điều trị',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 20,
        price: 0,
        room_type: 'examination',
      },
      {
        service_code: 'CAO-VR',
        service_name: 'Cạo vôi răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 45,
        price: 300000,
        room_type: 'examination',
      },
      {
        service_code: 'TRAM-R',
        service_name: 'Trám răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 60,
        price: 500000,
        room_type: 'examination',
      },
      {
        service_code: 'NHO-R',
        service_name: 'Nhổ răng',
        category_id: '22222222-2222-4222-8222-222222222203',
        duration: 45,
        price: 800000,
        room_type: 'surgery',
      },
      {
        service_code: 'TAY-T',
        service_name: 'Tẩy trắng răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 90,
        price: 3000000,
        room_type: 'examination',
      },
      {
        service_code: 'BOC-SU',
        service_name: 'Bọc răng sứ',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 120,
        price: 5000000,
        room_type: 'examination',
      },
      {
        service_code: 'IMPLANT',
        service_name: 'Cấy ghép Implant',
        category_id: '22222222-2222-4222-8222-222222222203',
        duration: 120,
        price: 15000000,
        room_type: 'surgery',
      },
      {
        service_code: 'NIENG-R',
        service_name: 'Niềng răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 150,
        price: 30000000,
        room_type: 'examination',
      },
      {
        service_code: 'CHUP-XQ',
        service_name: 'Chụp X-Quang',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 15,
        price: 150000,
        room_type: 'imaging',
      },
    ];

    for (const svc of services) {
      await dataSource.query(
        `INSERT INTO services (service_code, service_name, category_id, duration_minutes, base_price, required_room_type)
         VALUES ($1, $2, $3, $4, $5, $6::clinic_room_type)
         ON CONFLICT (service_code) DO UPDATE SET
           service_name = EXCLUDED.service_name,
           category_id = EXCLUDED.category_id,
           duration_minutes = EXCLUDED.duration_minutes,
           base_price = EXCLUDED.base_price,
           required_room_type = EXCLUDED.required_room_type,
           is_active = true,
           requires_appointment = true`,
        [
          svc.service_code,
          svc.service_name,
          svc.category_id,
          svc.duration,
          svc.price,
          svc.room_type,
        ],
      );
    }
    console.log('  ✅ Services seeded');

    // ─── Seed Work Shifts ───
    const shifts = [
      {
        shift_id: '33333333-3333-4333-8333-333333333301',
        shift_name: 'Ca sáng',
        start_time: '09:00',
        end_time: '12:00',
        description: 'Ca làm việc buổi sáng theo giờ phòng khám Việt Nam',
      },
      {
        shift_id: '33333333-3333-4333-8333-333333333302',
        shift_name: 'Ca chiều',
        start_time: '13:30',
        end_time: '17:30',
        description: 'Ca làm việc buổi chiều theo giờ phòng khám Việt Nam',
      },
    ];

    for (const shift of shifts) {
      await dataSource.query(
        `INSERT INTO work_shifts (shift_id, shift_name, start_time, end_time, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (shift_id) DO UPDATE SET
           shift_name = EXCLUDED.shift_name,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           description = EXCLUDED.description`,
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

    // ─── Seed Patient Projections for chatbot demo ───
    const patients = [
      {
        patient_id: '77777777-7777-4777-8777-777777777771',
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        patient_code: 'PAT-DEMO-001',
        full_name: 'Patient One',
        date_of_birth: '1994-04-12',
        gender: 'female',
        phone: '0900000001',
        email: 'patient1@smile.com',
        address: '123 Demo Street',
        ward: 'Ben Nghe',
        district: 'Quan 1',
        city: 'Ho Chi Minh',
        emergency_contact: 'Demo Contact',
        emergency_phone: '0900000099',
        blood_type: 'O+',
        allergies: ['none'],
        chronic_diseases: ['none'],
        insurance_number: 'DEMO-INS-001',
        insurance_provider: 'SMILE Demo Insurance',
      },
      {
        patient_id: '77777777-7777-4777-8777-777777777772',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        patient_code: 'PAT-DEMO-002',
        full_name: 'Patient Two',
        date_of_birth: '1989-09-20',
        gender: 'male',
        phone: '0900000002',
        email: 'patient2@smile.com',
        address: '456 Demo Avenue',
        ward: 'Ben Thanh',
        district: 'Quan 1',
        city: 'Ho Chi Minh',
        emergency_contact: 'Demo Family',
        emergency_phone: '0900000088',
        blood_type: 'A+',
        allergies: ['penicillin'],
        chronic_diseases: ['none'],
        insurance_number: 'DEMO-INS-002',
        insurance_provider: 'SMILE Demo Insurance',
      },
    ];
    const patientIds: Record<string, string> = {};

    for (const patient of patients) {
      const [row] = await medicalDataSource.query(
        `INSERT INTO patients (
           patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email,
           address, ward, district, city, emergency_contact, emergency_phone, blood_type,
           allergies, chronic_diseases, insurance_number, insurance_provider
         )
         VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::text[], $17::text[], $18, $19)
         ON CONFLICT (patient_code) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           full_name = EXCLUDED.full_name,
           date_of_birth = EXCLUDED.date_of_birth,
           gender = EXCLUDED.gender,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           address = EXCLUDED.address,
           ward = EXCLUDED.ward,
           district = EXCLUDED.district,
           city = EXCLUDED.city,
           emergency_contact = EXCLUDED.emergency_contact,
           emergency_phone = EXCLUDED.emergency_phone,
           blood_type = EXCLUDED.blood_type,
           allergies = EXCLUDED.allergies,
           chronic_diseases = EXCLUDED.chronic_diseases,
           insurance_number = EXCLUDED.insurance_number,
           insurance_provider = EXCLUDED.insurance_provider
         RETURNING patient_id`,
        [
          patient.patient_id,
          patient.user_id,
          patient.patient_code,
          patient.full_name,
          patient.date_of_birth,
          patient.gender,
          patient.phone,
          patient.email,
          patient.address,
          patient.ward,
          patient.district,
          patient.city,
          patient.emergency_contact,
          patient.emergency_phone,
          patient.blood_type,
          patient.allergies,
          patient.chronic_diseases,
          patient.insurance_number,
          patient.insurance_provider,
        ],
      );
      patientIds[patient.patient_code] = row.patient_id;
    }
    console.log('  ✅ Patient projections seeded');

    // ─── Seed Doctor Specialties and Schedules for chatbot demo ───
    const seededServices = await dataSource.query(
      `SELECT service_id, service_code, base_price FROM services WHERE service_code = ANY($1)`,
      [services.map((svc) => svc.service_code)],
    );
    const serviceIds = Object.fromEntries(
      seededServices.map((service: { service_id: string; service_code: string }) => [
        service.service_code,
        service.service_id,
      ]),
    );

    for (const service of seededServices) {
      await dataSource.query(
        `INSERT INTO clinic_services (clinic_id, service_id, custom_price, is_available)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (clinic_id, service_id) DO UPDATE SET
           custom_price = EXCLUDED.custom_price,
           is_available = true`,
        [
          '11111111-1111-4111-8111-111111111101',
          service.service_id,
          service.base_price ?? 0,
        ],
      );
    }

    const seededSpecialties = await dataSource.query(
      `SELECT specialty_id, specialty_code FROM specialties WHERE specialty_code = ANY($1)`,
      [['GENERAL', 'ORTHO', 'IMPLANT', 'COSMETIC', 'PEDIATRIC']],
    );
    const specialtyIds = Object.fromEntries(
      seededSpecialties.map((specialty: { specialty_id: string; specialty_code: string }) => [
        specialty.specialty_code,
        specialty.specialty_id,
      ]),
    );
    const doctorSpecialties = [
      {
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        specialty_code: 'GENERAL',
        certification_number: 'DEMO-GEN-001',
        certified_date: '2023-01-15',
        is_primary: true,
      },
      {
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        specialty_code: 'COSMETIC',
        certification_number: 'DEMO-COS-001',
        certified_date: '2023-06-10',
        is_primary: false,
      },
      {
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        specialty_code: 'GENERAL',
        certification_number: 'DEMO-GEN-002',
        certified_date: '2022-09-20',
        is_primary: true,
      },
      {
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        specialty_code: 'IMPLANT',
        certification_number: 'DEMO-IMP-002',
        certified_date: '2024-02-12',
        is_primary: false,
      },
    ];

    for (const specialty of doctorSpecialties) {
      const specialtyId = specialtyIds[specialty.specialty_code];
      if (!specialtyId) {
        continue;
      }
      await dataSource.query(
        `INSERT INTO doctor_specialties
           (doctor_id, specialty_id, certification_number, certified_date, is_primary)
         VALUES ($1, $2, $3, $4::date, $5)
         ON CONFLICT (doctor_id, specialty_id) DO UPDATE SET
           certification_number = EXCLUDED.certification_number,
           certified_date = EXCLUDED.certified_date,
           is_primary = EXCLUDED.is_primary`,
        [
          specialty.doctor_id,
          specialtyId,
          specialty.certification_number,
          specialty.certified_date,
          specialty.is_primary,
        ],
      );
    }
    console.log('  ✅ Doctor specialties seeded');

    const schedules = [
      {
        schedule_id: '88888888-8888-4888-8888-888888888824',
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333301',
        work_date: rollingDate(1),
        room_id: '44444444-4444-4444-8444-444444444451',
        max_patients: 6,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888825',
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333302',
        work_date: rollingDate(1),
        room_id: '44444444-4444-4444-8444-444444444451',
        max_patients: 8,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888826',
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333301',
        work_date: rollingDate(2),
        room_id: '44444444-4444-4444-8444-444444444452',
        max_patients: 6,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888827',
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333302',
        work_date: rollingDate(2),
        room_id: '44444444-4444-4444-8444-444444444452',
        max_patients: 8,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888828',
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333301',
        work_date: rollingDate(1),
        room_id: '44444444-4444-4444-8444-444444444452',
        max_patients: 6,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888829',
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333302',
        work_date: rollingDate(1),
        room_id: '44444444-4444-4444-8444-444444444452',
        max_patients: 8,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888830',
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333301',
        work_date: rollingDate(4),
        room_id: '44444444-4444-4444-8444-444444444451',
        max_patients: 6,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888831',
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333302',
        work_date: rollingDate(5),
        room_id: '44444444-4444-4444-8444-444444444452',
        max_patients: 8,
      },
      {
        schedule_id: '88888888-8888-4888-8888-888888888832',
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        shift_id: '33333333-3333-4333-8333-333333333301',
        work_date: rollingDate(7),
        room_id: '44444444-4444-4444-8444-444444444451',
        max_patients: 6,
      },
    ];

    for (const schedule of schedules) {
      await dataSource.query(
        `INSERT INTO doctor_schedules
           (schedule_id, doctor_id, clinic_id, shift_id, work_date, room_id, max_patients, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', 'Local chatbot demo schedule')
         ON CONFLICT (schedule_id) DO UPDATE SET
           doctor_id = EXCLUDED.doctor_id,
           clinic_id = EXCLUDED.clinic_id,
           shift_id = EXCLUDED.shift_id,
           work_date = EXCLUDED.work_date,
           room_id = EXCLUDED.room_id,
           max_patients = EXCLUDED.max_patients,
           status = 'scheduled',
           notes = EXCLUDED.notes`,
        [
          schedule.schedule_id,
          schedule.doctor_id,
          schedule.clinic_id,
          schedule.shift_id,
          schedule.work_date,
          schedule.room_id,
          schedule.max_patients,
        ],
      );
    }
    console.log('  ✅ Doctor schedules seeded');

    const demoAppointments = [
      {
        appointment_id: '99999999-9999-4999-8999-999999999901',
        appointment_code: 'DEMO-BOOKED-D1-0900',
        patient_id: patientIds['PAT-DEMO-002'],
        doctor_id: '550e8400-e29b-41d4-a716-446655440001',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_id: '44444444-4444-4444-8444-444444444451',
        service_code: 'ORAL-CHECK',
        appointment_date: rollingDate(1),
        appointment_time: '09:00',
        duration_minutes: 30,
        appointment_type: 'Oral checking',
        status: 'scheduled',
        chief_complaint: 'Local demo booked slot',
        notes: 'Blocks the first morning slot so the chatbot can show booked times.',
        created_by: '550e8400-e29b-41d4-a716-446655440003',
      },
      {
        appointment_id: '99999999-9999-4999-8999-999999999902',
        appointment_code: 'DEMO-PATIENT-UPCOMING',
        patient_id: patientIds['PAT-DEMO-001'],
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_id: '44444444-4444-4444-8444-444444444452',
        service_code: 'ORAL-CHECK',
        appointment_date: rollingDate(3),
        appointment_time: '14:00',
        duration_minutes: 30,
        appointment_type: 'Oral checking',
        status: 'scheduled',
        chief_complaint: 'Routine oral check',
        notes: 'Patient-owned local demo appointment for lookup and reschedule.',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
      },
      {
        appointment_id: '99999999-9999-4999-8999-999999999903',
        appointment_code: 'DEMO-CLEANING-D2-1000',
        patient_id: patientIds['PAT-DEMO-002'],
        doctor_id: '550e8400-e29b-41d4-a716-446655440002',
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_id: '44444444-4444-4444-8444-444444444452',
        service_code: 'CAO-VR',
        appointment_date: rollingDate(2),
        appointment_time: '10:00',
        duration_minutes: 45,
        appointment_type: 'Cao voi rang',
        status: 'confirmed',
        chief_complaint: 'Calculus removal demo',
        notes: 'Shows a longer service blocking adjacent candidates.',
        created_by: '550e8400-e29b-41d4-a716-446655440003',
      },
    ];

    for (const appointment of demoAppointments) {
      const serviceId = serviceIds[appointment.service_code];
      if (!appointment.patient_id || !serviceId) {
        continue;
      }
      await dataSource.query(
        `INSERT INTO appointments (
           appointment_id, appointment_code, patient_id, doctor_id, clinic_id, room_id, service_id,
           appointment_date, appointment_time, duration_minutes, appointment_type, status,
           chief_complaint, notes, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::time, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (appointment_code) DO UPDATE SET
           patient_id = EXCLUDED.patient_id,
           doctor_id = EXCLUDED.doctor_id,
           clinic_id = EXCLUDED.clinic_id,
           room_id = EXCLUDED.room_id,
           service_id = EXCLUDED.service_id,
           appointment_date = EXCLUDED.appointment_date,
           appointment_time = EXCLUDED.appointment_time,
           duration_minutes = EXCLUDED.duration_minutes,
           appointment_type = EXCLUDED.appointment_type,
           status = EXCLUDED.status,
           chief_complaint = EXCLUDED.chief_complaint,
           notes = EXCLUDED.notes,
           created_by = EXCLUDED.created_by`,
        [
          appointment.appointment_id,
          appointment.appointment_code,
          appointment.patient_id,
          appointment.doctor_id,
          appointment.clinic_id,
          appointment.room_id,
          serviceId,
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.duration_minutes,
          appointment.appointment_type,
          appointment.status,
          appointment.chief_complaint,
          appointment.notes,
          appointment.created_by,
        ],
      );
    }
    console.log('  ✅ Demo appointments seeded');

    console.log('🌱 Clinic-service seed completed successfully!');
  } catch (error) {
    console.error('❌ Clinic-service seed failed:', error);
    process.exit(1);
  } finally {
    if (medicalDataSource.isInitialized) {
      await medicalDataSource.destroy();
    }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runClinicSeed();
