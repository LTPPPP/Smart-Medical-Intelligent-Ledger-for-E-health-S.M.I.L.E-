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

async function runClinicSeed() {
  console.log('🌱 Running clinic-service seeds...');

  try {
    await dataSource.initialize();

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
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng Khám 1',
        room_code: 'PK-01',
        room_type: 'examination',
        floor_number: 1,
      },
      {
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng Phẫu Thuật 1',
        room_code: 'PT-01',
        room_type: 'surgery',
        floor_number: 2,
      },
      {
        clinic_id: '11111111-1111-4111-8111-111111111101',
        room_name: 'Phòng X-Quang',
        room_code: 'XQ-01',
        room_type: 'imaging',
        floor_number: 1,
      },
      {
        clinic_id: '11111111-1111-4111-8111-111111111102',
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
        service_code: 'KHAM-TQ',
        service_name: 'Khám tổng quát',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 30,
        price: 200000,
      },
      {
        service_code: 'TU-VAN',
        service_name: 'Tư vấn điều trị',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 20,
        price: 0,
      },
      {
        service_code: 'CAO-VR',
        service_name: 'Cạo vôi răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 45,
        price: 300000,
      },
      {
        service_code: 'TRAM-R',
        service_name: 'Trám răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 60,
        price: 500000,
      },
      {
        service_code: 'NHO-R',
        service_name: 'Nhổ răng',
        category_id: '22222222-2222-4222-8222-222222222203',
        duration: 45,
        price: 800000,
      },
      {
        service_code: 'TAY-T',
        service_name: 'Tẩy trắng răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 90,
        price: 3000000,
      },
      {
        service_code: 'BOC-SU',
        service_name: 'Bọc răng sứ',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 120,
        price: 5000000,
      },
      {
        service_code: 'IMPLANT',
        service_name: 'Cấy ghép Implant',
        category_id: '22222222-2222-4222-8222-222222222203',
        duration: 120,
        price: 15000000,
      },
      {
        service_code: 'NIENG-R',
        service_name: 'Niềng răng',
        category_id: '22222222-2222-4222-8222-222222222202',
        duration: 90,
        price: 30000000,
      },
      {
        service_code: 'CHUP-XQ',
        service_name: 'Chụp X-Quang',
        category_id: '22222222-2222-4222-8222-222222222201',
        duration: 15,
        price: 150000,
      },
    ];

    for (const svc of services) {
      await dataSource.query(
        `INSERT INTO services (service_code, service_name, category_id, duration_minutes, base_price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (service_code) DO NOTHING`,
        [
          svc.service_code,
          svc.service_name,
          svc.category_id,
          svc.duration,
          svc.price,
        ],
      );
    }
    console.log('  ✅ Services seeded');

    // ─── Seed Work Shifts ───
    const shifts = [
      {
        shift_id: '33333333-3333-4333-8333-333333333301',
        shift_name: 'Ca sáng',
        start_time: '08:00',
        end_time: '12:00',
        description: 'Ca làm việc buổi sáng',
      },
      {
        shift_id: '33333333-3333-4333-8333-333333333302',
        shift_name: 'Ca chiều',
        start_time: '13:00',
        end_time: '17:00',
        description: 'Ca làm việc buổi chiều',
      },
      {
        shift_id: '33333333-3333-4333-8333-333333333303',
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

    console.log('🌱 Clinic-service seed completed successfully!');
  } catch (error) {
    console.error('❌ Clinic-service seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runClinicSeed();
