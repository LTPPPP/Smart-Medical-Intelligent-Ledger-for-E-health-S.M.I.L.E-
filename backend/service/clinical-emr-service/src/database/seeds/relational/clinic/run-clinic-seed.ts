import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getSanitizedErrorMetadata } from '../../../../common/error-metadata';
import {
  seedClinicOperationalData,
  seedMedicalFeatureData,
} from './seed-feature-data';
import {
  EXAMINATION_READY_DOCTOR_COUNT,
  TOTAL_SEEDED_APPOINTMENTS,
  getExaminationReadySeedSlot,
  shouldSeedCompletedEncounter,
} from './clinic-seed-appointments';
import { getSeedScheduleDates } from './clinic-seed-schedules';

config();

const clinicDataSource = new DataSource({
  type: 'postgres' as const,
  host:
    process.env.CLINIC_DATABASE_HOST ||
    process.env.DATABASE_HOST ||
    'localhost',
  port: Number.parseInt(
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
  port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'core_medical_service_db',
  synchronize: false,
  logging: false,
});

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const MANAGER_IDS = [1, 2].map(accountId);
const DOCTOR_IDS = Array.from({ length: 8 }, (_, index) =>
  accountId(index + 3),
);
const RECEPTIONIST_IDS = Array.from({ length: 4 }, (_, index) =>
  accountId(index + 11),
);
const NURSE_IDS = Array.from({ length: 5 }, (_, index) =>
  accountId(index + 15),
);
const PATIENT_ACCOUNT_IDS = Array.from({ length: 40 }, (_, index) =>
  accountId(index + 20),
);
// Anchored on the day the seed actually runs (normalised to UTC midnight) rather
// than a fixed literal, so the generated schedule window never silently goes stale.
const ANCHOR_DATE = (() => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
})();
const DOCTOR_COUNT = EXAMINATION_READY_DOCTOR_COUNT;
const PATIENT_COUNT = 40;
const LEAVE_COUNT = 16;

function accountId(sequence: number): string {
  return `550e8400-e29b-41d4-a716-${String(446655440000 + sequence).padStart(12, '0')}`;
}

function fixedUuid(prefix: string, sequence: number): string {
  return `${prefix}000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function timestampOn(date: Date, time: string): Date {
  return new Date(`${dateOnly(date)}T${time}:00.000Z`);
}

const clinics = [
  {
    id: fixedUuid('c1', 1),
    code: 'SMILE-HCM',
    name: 'S.M.I.L.E Dental Center - Ho Chi Minh City',
    address: '18 Nguyen Hue Boulevard',
    ward: 'Ben Nghe Ward',
    district: 'District 1',
    city: 'Ho Chi Minh City',
    phone: '02838221001',
    email: 'contact.hcm@smilecare.vn',
    license: 'DENT-HCM-24001',
    logoUrl: '/images/clinics/smile-hcm.svg',
  },
  {
    id: fixedUuid('c1', 2),
    code: 'SMILE-HN',
    name: 'S.M.I.L.E Dental Center - Hanoi',
    address: '42 Ly Thuong Kiet Street',
    ward: 'Tran Hung Dao Ward',
    district: 'Hoan Kiem District',
    city: 'Hanoi',
    phone: '02439261002',
    email: 'contact.hanoi@smilecare.vn',
    license: 'DENT-HN-24002',
    logoUrl: '/images/clinics/smile-hn.svg',
  },
  {
    id: fixedUuid('c1', 3),
    code: 'SMILE-DN',
    name: 'S.M.I.L.E Dental Center - Da Nang',
    address: '75 Bach Dang Street',
    ward: 'Hai Chau Ward',
    district: 'Hai Chau District',
    city: 'Da Nang',
    phone: '02363571003',
    email: 'contact.danang@smilecare.vn',
    license: 'DENT-DN-24003',
    logoUrl: '/images/clinics/smile-dn.svg',
  },
  {
    id: fixedUuid('c1', 4),
    code: 'SMILE-CT',
    name: 'S.M.I.L.E Dental Center - Can Tho',
    address: '29 Hoa Binh Avenue',
    ward: 'Tan An Ward',
    district: 'Ninh Kieu District',
    city: 'Can Tho',
    phone: '02923761004',
    email: 'contact.cantho@smilecare.vn',
    license: 'DENT-CT-24004',
    logoUrl: '/images/clinics/smile-ct.svg',
  },
] as const;

const specialties = [
  ['GENERAL', 'General Dentistry', 'Comprehensive oral care'],
  ['ORTHO', 'Orthodontics', 'Bite alignment and tooth positioning'],
  ['ENDO', 'Endodontics', 'Dental pulp and root canal care'],
  ['PERIO', 'Periodontics', 'Gum and supporting tissue care'],
  ['SURGERY', 'Oral Surgery', 'Surgical dental procedures'],
  ['COSMETIC', 'Cosmetic Dentistry', 'Aesthetic dental restoration'],
  ['PEDIATRIC', 'Pediatric Dentistry', 'Oral care for children'],
  ['RADIOLOGY', 'Oral Radiology', 'Dental diagnostic imaging'],
] as const;

const clinicSpecialtyCodes: ReadonlyArray<readonly string[]> = [
  ['GENERAL', 'ORTHO', 'SURGERY', 'COSMETIC', 'RADIOLOGY'],
  ['GENERAL', 'ORTHO', 'ENDO', 'PERIO', 'RADIOLOGY'],
  ['GENERAL', 'SURGERY', 'COSMETIC', 'PEDIATRIC', 'RADIOLOGY'],
  ['GENERAL', 'ORTHO', 'PERIO', 'PEDIATRIC', 'RADIOLOGY'],
];

const categories = [
  ['PREVENTIVE', 'Preventive Care', 'Routine care that protects oral health'],
  ['RESTORATIVE', 'Restorative Care', 'Repair and replacement procedures'],
  ['SURGICAL', 'Surgical Care', 'Operative dental procedures'],
  ['ORTHODONTIC', 'Orthodontic Care', 'Bite and alignment procedures'],
  [
    'DIAGNOSTIC',
    'Diagnostic and Cosmetic Care',
    'Imaging and aesthetic procedures',
  ],
] as const;

const services = [
  [
    'EXAM-COMP',
    'Comprehensive Dental Examination',
    'PREVENTIVE',
    'GENERAL',
    30,
    200000,
    'examination',
  ],
  [
    'EXAM-URGENT',
    'Urgent Dental Examination',
    'PREVENTIVE',
    'GENERAL',
    30,
    300000,
    'examination',
  ],
  [
    'CLEAN-ROUTINE',
    'Routine Dental Cleaning',
    'PREVENTIVE',
    'PERIO',
    45,
    450000,
    'examination',
  ],
  [
    'PERIO-DEEP',
    'Deep Cleaning and Root Planing',
    'PREVENTIVE',
    'PERIO',
    75,
    900000,
    'examination',
  ],
  [
    'FILL-COMP',
    'Composite Dental Filling',
    'RESTORATIVE',
    'GENERAL',
    60,
    650000,
    'examination',
  ],
  [
    'INLAY-CERAMIC',
    'Ceramic Dental Inlay',
    'RESTORATIVE',
    'GENERAL',
    90,
    4000000,
    'examination',
  ],
  [
    'ROOT-SINGLE',
    'Single Canal Root Treatment',
    'RESTORATIVE',
    'ENDO',
    90,
    1800000,
    'examination',
  ],
  [
    'ROOT-MULTI',
    'Multiple Canal Root Treatment',
    'RESTORATIVE',
    'ENDO',
    120,
    3200000,
    'examination',
  ],
  [
    'EXTRACT-SIMPLE',
    'Simple Tooth Extraction',
    'SURGICAL',
    'SURGERY',
    45,
    800000,
    'surgery',
  ],
  [
    'EXTRACT-WISDOM',
    'Wisdom Tooth Extraction',
    'SURGICAL',
    'SURGERY',
    90,
    3000000,
    'surgery',
  ],
  [
    'IMPLANT-SINGLE',
    'Single Dental Implant',
    'SURGICAL',
    'SURGERY',
    120,
    18000000,
    'surgery',
  ],
  [
    'BRACES-METAL',
    'Metal Orthodontic Braces',
    'ORTHODONTIC',
    'ORTHO',
    90,
    28000000,
    'examination',
  ],
  [
    'BRACES-CERAMIC',
    'Ceramic Orthodontic Braces',
    'ORTHODONTIC',
    'ORTHO',
    90,
    40000000,
    'examination',
  ],
  [
    'ALIGNER-CLEAR',
    'Clear Aligner Treatment',
    'ORTHODONTIC',
    'ORTHO',
    60,
    55000000,
    'examination',
  ],
  [
    'WHITEN-OFFICE',
    'In-Office Teeth Whitening',
    'DIAGNOSTIC',
    'COSMETIC',
    90,
    3500000,
    'examination',
  ],
  [
    'VENEER-CERAMIC',
    'Ceramic Dental Veneer',
    'DIAGNOSTIC',
    'COSMETIC',
    120,
    8000000,
    'examination',
  ],
  [
    'CROWN-CERAMIC',
    'Ceramic Dental Crown',
    'RESTORATIVE',
    'GENERAL',
    120,
    6000000,
    'examination',
  ],
  [
    'DENTURE-PARTIAL',
    'Removable Partial Denture',
    'RESTORATIVE',
    'GENERAL',
    90,
    12000000,
    'examination',
  ],
  [
    'CHILD-EXAM',
    'Child Dental Examination',
    'PREVENTIVE',
    'PEDIATRIC',
    30,
    200000,
    'examination',
  ],
  [
    'SEALANT-CHILD',
    'Protective Dental Sealant',
    'PREVENTIVE',
    'PEDIATRIC',
    30,
    350000,
    'examination',
  ],
  [
    'FLUORIDE-CHILD',
    'Fluoride Varnish Application',
    'PREVENTIVE',
    'PEDIATRIC',
    30,
    300000,
    'examination',
  ],
  [
    'XRAY-BITEWING',
    'Bitewing Dental Radiograph',
    'DIAGNOSTIC',
    'RADIOLOGY',
    20,
    250000,
    'imaging',
  ],
  [
    'XRAY-PANORAMIC',
    'Panoramic Dental Radiograph',
    'DIAGNOSTIC',
    'RADIOLOGY',
    30,
    500000,
    'imaging',
  ],
  [
    'SCAN-CBCT',
    'Cone Beam Dental Scan',
    'DIAGNOSTIC',
    'RADIOLOGY',
    45,
    1500000,
    'imaging',
  ],
] as const;

const doctorProfiles = [
  { specialty: 'GENERAL', clinic: 0, roomType: 'examination' },
  { specialty: 'ORTHO', clinic: 1, roomType: 'examination' },
  { specialty: 'ENDO', clinic: 2, roomType: 'examination' },
  { specialty: 'PERIO', clinic: 3, roomType: 'examination' },
  { specialty: 'SURGERY', clinic: 0, roomType: 'surgery' },
  { specialty: 'COSMETIC', clinic: 1, roomType: 'examination' },
  { specialty: 'PEDIATRIC', clinic: 2, roomType: 'examination' },
  { specialty: 'RADIOLOGY', clinic: 3, roomType: 'imaging' },
] as const;

const clinicalProfiles: Record<
  string,
  {
    complaint: string;
    illness: string;
    examination: string;
    symptom: string;
    location: string;
    diagnosis: string;
    icd: string;
    objective: string;
  }
> = {
  GENERAL: {
    complaint: 'Localized sensitivity while chewing',
    illness: 'Intermittent sensitivity developed during the previous week',
    examination: 'A localized enamel defect was identified without swelling',
    symptom: 'Dental sensitivity',
    location: 'Posterior tooth',
    diagnosis: 'Dental caries limited to enamel',
    icd: 'K02.9',
    objective: 'Restore the affected tooth and preserve healthy structure',
  },
  ORTHO: {
    complaint: 'Difficulty cleaning crowded front teeth',
    illness: 'Crowding has gradually become more noticeable',
    examination: 'Mild anterior crowding with a stable periodontal condition',
    symptom: 'Dental crowding',
    location: 'Anterior teeth',
    diagnosis: 'Dental arch crowding',
    icd: 'K07.3',
    objective: 'Improve alignment and establish a maintainable bite',
  },
  ENDO: {
    complaint: 'Persistent pain after hot and cold drinks',
    illness: 'Pain lingers after temperature exposure and interrupts sleep',
    examination: 'The involved tooth was tender to percussion',
    symptom: 'Lingering tooth pain',
    location: 'Molar region',
    diagnosis: 'Irreversible pulpitis',
    icd: 'K04.0',
    objective: 'Remove inflamed pulp tissue and seal the root canal system',
  },
  PERIO: {
    complaint: 'Bleeding gums during brushing',
    illness: 'Bleeding has occurred regularly for several weeks',
    examination: 'Generalized plaque deposits and mild gingival inflammation',
    symptom: 'Gingival bleeding',
    location: 'Gum line',
    diagnosis: 'Plaque-induced gingivitis',
    icd: 'K05.1',
    objective: 'Reduce inflammation and improve daily plaque control',
  },
  SURGERY: {
    complaint: 'Pain and swelling near a back tooth',
    illness: 'Discomfort increased over three days with limited chewing',
    examination: 'Localized tenderness was present around the involved tooth',
    symptom: 'Localized dental swelling',
    location: 'Posterior jaw',
    diagnosis: 'Impacted tooth with localized inflammation',
    icd: 'K01.1',
    objective: 'Remove the affected tooth and support uncomplicated healing',
  },
  COSMETIC: {
    complaint: 'Concern about visible tooth discoloration',
    illness: 'Discoloration has remained stable without pain',
    examination: 'Surface staining was present with intact enamel',
    symptom: 'Tooth discoloration',
    location: 'Front teeth',
    diagnosis: 'Extrinsic tooth staining',
    icd: 'K03.6',
    objective: 'Improve tooth shade while protecting enamel',
  },
  PEDIATRIC: {
    complaint: 'Parent reports sensitivity in a primary molar',
    illness: 'Brief sensitivity occurs when eating sweet foods',
    examination: 'A shallow occlusal lesion was visible without swelling',
    symptom: 'Brief tooth sensitivity',
    location: 'Primary molar',
    diagnosis: 'Early childhood dental caries',
    icd: 'K02.9',
    objective: 'Control decay and reinforce preventive home care',
  },
  RADIOLOGY: {
    complaint: 'Further imaging requested for treatment planning',
    illness: 'Clinical findings require evaluation of underlying structures',
    examination: 'Oral tissues were stable and imaging was indicated',
    symptom: 'Uncertain dental structure',
    location: 'Jaw and dentition',
    diagnosis: 'Dental condition requiring radiographic assessment',
    icd: 'Z01.2',
    objective: 'Document anatomical findings for definitive treatment planning',
  },
};

async function seedClinicReferenceData(): Promise<{
  categoryByCode: Record<string, string>;
  specialtyByCode: Record<string, string>;
  serviceByCode: Record<string, string>;
  roomByClinicAndType: Record<string, string>;
}> {
  const operatingHours = JSON.stringify({
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '08:00', close: '16:00' },
    sunday: null,
  });

  for (const clinic of clinics) {
    await clinicDataSource.query(
      `INSERT INTO clinics
         (clinic_id, clinic_name, clinic_code, address, ward, district, city,
          phone, email, operating_hours, status, license_number, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'ACTIVE',$11,$12)
       ON CONFLICT (clinic_code) DO UPDATE SET
         clinic_name = EXCLUDED.clinic_name,
         address = EXCLUDED.address,
         ward = EXCLUDED.ward,
         district = EXCLUDED.district,
         city = EXCLUDED.city,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         operating_hours = EXCLUDED.operating_hours,
         status = EXCLUDED.status,
         license_number = EXCLUDED.license_number,
         logo_url = EXCLUDED.logo_url`,
      [
        clinic.id,
        clinic.name,
        clinic.code,
        clinic.address,
        clinic.ward,
        clinic.district,
        clinic.city,
        clinic.phone,
        clinic.email,
        operatingHours,
        clinic.license,
        clinic.logoUrl,
      ],
    );
  }

  const roomByClinicAndType: Record<string, string> = {};
  const roomBlueprints = [
    ['EXAM-01', 'Examination Room One', 'examination', 1],
    ['EXAM-02', 'Examination Room Two', 'examination', 1],
    ['CONSULT-01', 'Consultation Suite', 'examination', 1],
    ['SURGERY-01', 'Oral Surgery Room', 'surgery', 2],
    ['SURGERY-02', 'Implant Surgery Room', 'surgery', 2],
    ['IMAGING-01', 'Dental Imaging Room', 'imaging', 1],
  ] as const;
  let roomSequence = 1;
  for (const clinic of clinics) {
    for (const [code, name, type, floor] of roomBlueprints) {
      const roomId = fixedUuid('c2', roomSequence++);
      await clinicDataSource.query(
        `INSERT INTO treatment_rooms
           (room_id, clinic_id, room_name, room_code, room_type, floor_number,
            equipment_list, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'AVAILABLE')
         ON CONFLICT (clinic_id, room_code) DO UPDATE SET
           room_name = EXCLUDED.room_name,
           room_type = EXCLUDED.room_type,
           floor_number = EXCLUDED.floor_number,
           equipment_list = EXCLUDED.equipment_list,
           status = EXCLUDED.status`,
        [
          roomId,
          clinic.id,
          name,
          code,
          type,
          floor,
          JSON.stringify({
            chair: 'Electric dental chair',
            sterilization: 'Chairside sterilization unit',
          }),
        ],
      );
      if (!roomByClinicAndType[`${clinic.id}:${type}`]) {
        roomByClinicAndType[`${clinic.id}:${type}`] = roomId;
      }
    }
  }

  for (let index = 0; index < specialties.length; index++) {
    const [code, name, description] = specialties[index];
    await clinicDataSource.query(
      `INSERT INTO specialties
         (specialty_id, specialty_name, specialty_code, description,
          is_active, display_order)
       VALUES ($1,$2,$3,$4,TRUE,$5)
       ON CONFLICT (specialty_code) DO UPDATE SET
         specialty_name = EXCLUDED.specialty_name,
         description = EXCLUDED.description,
         is_active = EXCLUDED.is_active,
         display_order = EXCLUDED.display_order`,
      [fixedUuid('b1', index + 1), name, code, description, index + 1],
    );
  }

  const specialtyRows: Array<{
    specialty_id: string;
    specialty_code: string;
  }> = await clinicDataSource.query(
    `SELECT specialty_id, specialty_code FROM specialties`,
  );
  const specialtyByCode = Object.fromEntries(
    specialtyRows.map((row) => [row.specialty_code, row.specialty_id]),
  );

  for (let clinicIndex = 0; clinicIndex < clinics.length; clinicIndex++) {
    for (const specialtyCode of clinicSpecialtyCodes[clinicIndex]) {
      await clinicDataSource.query(
        `INSERT INTO clinic_specialties (clinic_id, specialty_id)
         VALUES ($1,$2)
         ON CONFLICT (clinic_id, specialty_id) DO NOTHING`,
        [clinics[clinicIndex].id, specialtyByCode[specialtyCode]],
      );
    }
  }

  for (let index = 0; index < categories.length; index++) {
    const [, name, description] = categories[index];
    await clinicDataSource.query(
      `INSERT INTO service_categories
         (category_id, category_name, description, is_active, display_order)
       VALUES ($1,$2,$3,TRUE,$4)
       ON CONFLICT (category_id) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description,
         is_active = EXCLUDED.is_active,
         display_order = EXCLUDED.display_order`,
      [fixedUuid('b2', index + 1), name, description, index + 1],
    );
  }
  const categoryByCode = Object.fromEntries(
    categories.map(([code], index) => [code, fixedUuid('b2', index + 1)]),
  );

  for (let index = 0; index < services.length; index++) {
    const [code, name, category, specialty, duration, price, roomType] =
      services[index];
    await clinicDataSource.query(
      `INSERT INTO services
         (service_id, service_code, service_name, category_id, specialty_id,
          description, duration_minutes, required_room_type, base_price,
          currency, is_active, requires_appointment, preparation_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'VND',TRUE,TRUE,$10)
       ON CONFLICT (service_code) DO UPDATE SET
         service_name = EXCLUDED.service_name,
         category_id = EXCLUDED.category_id,
         specialty_id = EXCLUDED.specialty_id,
         description = EXCLUDED.description,
         duration_minutes = EXCLUDED.duration_minutes,
         required_room_type = EXCLUDED.required_room_type,
         base_price = EXCLUDED.base_price,
         currency = EXCLUDED.currency,
         is_active = EXCLUDED.is_active,
         requires_appointment = EXCLUDED.requires_appointment,
         preparation_instructions = EXCLUDED.preparation_instructions`,
      [
        fixedUuid('a2', index + 1),
        code,
        name,
        categoryByCode[category],
        specialtyByCode[specialty],
        `${name} delivered by the ${specialties.find(([key]) => key === specialty)?.[1]} team`,
        duration,
        roomType,
        price,
        'Bring current medication and allergy information to the visit',
      ],
    );
  }

  const serviceRows: Array<{ service_id: string; service_code: string }> =
    await clinicDataSource.query(
      `SELECT service_id, service_code FROM services`,
    );
  const serviceByCode = Object.fromEntries(
    serviceRows.map((row) => [row.service_code, row.service_id]),
  );

  for (const clinic of clinics) {
    for (const service of services) {
      await clinicDataSource.query(
        `INSERT INTO clinic_services
           (clinic_id, service_id, custom_price, is_available)
         VALUES ($1,$2,$3,TRUE)
         ON CONFLICT (clinic_id, service_id) DO UPDATE SET
           custom_price = EXCLUDED.custom_price,
           is_available = EXCLUDED.is_available`,
        [clinic.id, serviceByCode[service[0]], service[5]],
      );
    }
  }

  return {
    categoryByCode,
    specialtyByCode,
    serviceByCode,
    roomByClinicAndType,
  };
}

async function seedWorkforce(
  specialtyByCode: Record<string, string>,
  roomByClinicAndType: Record<string, string>,
): Promise<void> {
  for (let index = 0; index < doctorProfiles.length; index++) {
    const profile = doctorProfiles[index];
    await clinicDataSource.query(
      `INSERT INTO doctor_specialties
         (doctor_id, specialty_id, certification_number, certified_date,
          is_primary)
       VALUES ($1,$2,$3,$4,TRUE)
       ON CONFLICT (doctor_id, specialty_id) DO UPDATE SET
         certification_number = EXCLUDED.certification_number,
         certified_date = EXCLUDED.certified_date,
         is_primary = EXCLUDED.is_primary`,
      [
        DOCTOR_IDS[index],
        specialtyByCode[profile.specialty],
        `DENT-CERT-${String(index + 1).padStart(3, '0')}`,
        `20${18 + (index % 5)}-06-15`,
      ],
    );
  }

  const shifts = [
    [fixedUuid('d1', 1), 'Morning Shift', '08:00', '12:00'],
    [fixedUuid('d1', 2), 'Afternoon Shift', '13:00', '17:00'],
  ] as const;
  for (const [id, name, start, end] of shifts) {
    await clinicDataSource.query(
      `INSERT INTO work_shifts
         (shift_id, shift_name, start_time, end_time, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (shift_id) DO UPDATE SET
         shift_name = EXCLUDED.shift_name,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         description = EXCLUDED.description`,
      [id, name, start, end, `${name} for scheduled patient care`],
    );
  }

  let scheduleSequence = 1;
  for (const workDate of getSeedScheduleDates(ANCHOR_DATE)) {
    for (let doctorIndex = 0; doctorIndex < DOCTOR_COUNT; doctorIndex++) {
      const profile = doctorProfiles[doctorIndex];
      const clinic = clinics[profile.clinic];
      for (const [shiftId] of shifts) {
        await clinicDataSource.query(
          `INSERT INTO doctor_schedules
             (schedule_id, doctor_id, clinic_id, shift_id, work_date, room_id,
              max_patients, status, notes)
           VALUES ($1,$2,$3,$4,$5,$6,12,'scheduled',$7)
           ON CONFLICT (doctor_id, work_date, shift_id) DO UPDATE SET
             clinic_id = EXCLUDED.clinic_id,
             room_id = EXCLUDED.room_id,
             max_patients = EXCLUDED.max_patients,
             status = EXCLUDED.status,
             notes = EXCLUDED.notes`,
          [
            fixedUuid('d2', scheduleSequence++),
            DOCTOR_IDS[doctorIndex],
            clinic.id,
            shiftId,
            dateOnly(workDate),
            roomByClinicAndType[`${clinic.id}:${profile.roomType}`],
            'Standard clinical availability',
          ],
        );
      }
    }
  }

  const leaveReasons = [
    'Annual personal leave',
    'Professional development course',
    'Family commitment',
    'Medical recovery day',
  ];
  for (let index = 0; index < LEAVE_COUNT; index++) {
    const status =
      index % 4 === 0 ? 'pending' : index % 4 === 1 ? 'rejected' : 'approved';
    const startDate = addDays(ANCHOR_DATE, -10 + index * 3);
    await clinicDataSource.query(
      `INSERT INTO doctor_leaves
         (leave_id, doctor_id, leave_type, start_date, end_date, reason, status,
          approved_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (leave_id) DO UPDATE SET
         doctor_id = EXCLUDED.doctor_id,
         leave_type = EXCLUDED.leave_type,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         reason = EXCLUDED.reason,
         status = EXCLUDED.status,
         approved_by = EXCLUDED.approved_by`,
      [
        fixedUuid('d3', index + 1),
        DOCTOR_IDS[index % DOCTOR_COUNT],
        index % 5 === 3 ? 'sick' : index % 5 === 4 ? 'emergency' : 'annual',
        dateOnly(startDate),
        dateOnly(addDays(startDate, index % 3 === 0 ? 1 : 0)),
        leaveReasons[index % leaveReasons.length],
        status,
        status === 'pending' ? null : MANAGER_IDS[index % MANAGER_IDS.length],
      ],
    );
  }
}

async function seedPatients(): Promise<string[]> {
  const patientNames = [
    'Lucas Nguyen',
    'Emma Tran',
    'Oliver Le',
    'Chloe Pham',
    'James Vo',
    'Lily Bui',
    'William Hoang',
    'Hannah Do',
    'Alexander Vu',
    'Zoe Truong',
    'Michael Dang',
    'Nora Cao',
    'Sebastian Huynh',
    'Ella Ly',
    'Jack Lam',
    'Maya Dinh',
    'Leo Mai',
    'Ruby Nguyen',
    'Theodore Tran',
    'Alice Le',
    'Samuel Pham',
    'Clara Vo',
    'Joseph Bui',
    'Lucy Hoang',
    'Daniel Do',
    'Eva Vu',
    'Matthew Truong',
    'Stella Dang',
    'Andrew Cao',
    'Ivy Huynh',
    'Gabriel Ly',
    'Anna Lam',
    'Nathan Dinh',
    'Rose Mai',
    'Thomas Nguyen',
    'Julia Tran',
    'Christopher Le',
    'Sarah Pham',
    'Jonathan Vo',
    'Violet Bui',
  ];
  const cities = clinics.map((clinic) => clinic.city);
  const patientIds: string[] = [];

  for (let index = 0; index < PATIENT_COUNT; index++) {
    const iamIndex = index + 20;
    const patientId = fixedUuid('a3', index + 1);
    const allergies =
      index % 5 === 0
        ? ['Penicillin']
        : index % 7 === 0
          ? ['Latex']
          : ['No known allergies'];
    const chronicConditions =
      index % 6 === 0
        ? ['Controlled hypertension']
        : index % 9 === 0
          ? ['Controlled type 2 diabetes']
          : ['No known chronic conditions'];
    await medicalDataSource.query(
      `INSERT INTO patients
         (patient_id, user_id, patient_code, full_name, date_of_birth, gender,
          phone, email, address, ward, district, city, emergency_contact,
          emergency_phone, allergies, chronic_diseases, insurance_number,
          insurance_provider)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
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
         allergies = EXCLUDED.allergies,
         chronic_diseases = EXCLUDED.chronic_diseases,
         insurance_number = EXCLUDED.insurance_number,
         insurance_provider = EXCLUDED.insurance_provider`,
      [
        patientId,
        PATIENT_ACCOUNT_IDS[index],
        `PAT-2026-${String(index + 1).padStart(4, '0')}`,
        patientNames[index],
        `${1970 + (iamIndex % 25)}-${String((iamIndex % 12) + 1).padStart(2, '0')}-${String((iamIndex % 27) + 1).padStart(2, '0')}`,
        iamIndex % 2 === 0 ? 2 : 1,
        `0908${String(310000 + index).padStart(6, '0')}`,
        `patient${index + 1}@smile.com`,
        `${20 + index} Riverside Avenue`,
        'Central Ward',
        'Central District',
        cities[index % cities.length],
        `Emergency Contact ${String(index + 1).padStart(2, '0')}`,
        `0917${String(420000 + index).padStart(6, '0')}`,
        allergies,
        chronicConditions,
        `DHI-26-${String(700001 + index)}`,
        'Vietnam Health Assurance',
      ],
    );
    patientIds.push(patientId);
  }
  return patientIds;
}

function appointmentState(sequence: number): {
  date: Date;
  status: string;
  cancellationReason: string | null;
} {
  const examinationReadySlot = getExaminationReadySeedSlot(sequence);
  if (examinationReadySlot) {
    return {
      date: new Date(`${examinationReadySlot.date}T00:00:00.000Z`),
      status: examinationReadySlot.status,
      cancellationReason: null,
    };
  }

  if (sequence <= 180) {
    const date = addDays(ANCHOR_DATE, -90 + Math.floor((sequence - 1) / 2));
    if (sequence % 17 === 0) {
      return {
        date,
        status: 'cancelled',
        cancellationReason: 'Patient requested a different visit date',
      };
    }
    if (sequence % 13 === 0) {
      return { date, status: 'no_show', cancellationReason: null };
    }
    return { date, status: 'completed', cancellationReason: null };
  }
  return {
    date: addDays(ANCHOR_DATE, 1 + Math.floor((sequence - 181) / 2)),
    status: sequence % 2 === 0 ? 'confirmed' : 'scheduled',
    cancellationReason: null,
  };
}

interface SeededAppointment {
  sequence: number;
  appointmentId: string;
  patientId: string;
  patientAccountId: string;
  doctorId: string;
  clinicId: string;
  service: (typeof services)[number];
  date: Date;
  time: string;
  status: string;
  createdBy: string;
  approvedBy: string | null;
}

async function seedAppointments(
  patientIds: string[],
  serviceByCode: Record<string, string>,
  roomByClinicAndType: Record<string, string>,
): Promise<SeededAppointment[]> {
  const appointments: SeededAppointment[] = [];
  for (let sequence = 1; sequence <= TOTAL_SEEDED_APPOINTMENTS; sequence++) {
    // Keep historical data varied, but distribute upcoming appointments
    // Round-robin across every doctor so each dashboard has representative data.
    const examinationReadySlot = getExaminationReadySeedSlot(sequence);
    const doctorIndex =
      examinationReadySlot?.doctorIndex ??
      (sequence > 180
        ? (sequence - 181) % doctorProfiles.length
        : doctorProfiles.findIndex(
            (profile) =>
              profile.specialty ===
              services[(sequence - 1) % services.length][3],
          ));
    const profile = doctorProfiles[doctorIndex];
    const matchingServices = services.filter(
      (candidate) => candidate[3] === profile.specialty,
    );
    const service =
      sequence > 180
        ? matchingServices[(sequence - 181) % matchingServices.length]
        : services[(sequence - 1) % services.length];
    const specialty = service[3];
    const clinic = clinics[profile.clinic];
    const state = appointmentState(sequence);
    const time =
      examinationReadySlot?.time ?? (sequence % 2 === 0 ? '14:00' : '09:00');
    const appointmentId = fixedUuid('a5', sequence);
    const patientId = patientIds[(sequence - 1) % patientIds.length];
    const patientAccountId =
      PATIENT_ACCOUNT_IDS[(sequence - 1) % PATIENT_ACCOUNT_IDS.length];
    const cancelledAt =
      state.status === 'cancelled' ? timestampOn(state.date, time) : null;
    const createdBy = examinationReadySlot
      ? RECEPTIONIST_IDS[doctorIndex % RECEPTIONIST_IDS.length]
      : sequence % 5 === 0
        ? RECEPTIONIST_IDS[(sequence - 1) % RECEPTIONIST_IDS.length]
        : sequence % 7 === 0
          ? MANAGER_IDS[(sequence - 1) % MANAGER_IDS.length]
          : patientAccountId;
    const approvedBy =
      state.status === 'scheduled' || state.status === 'confirmed'
        ? MANAGER_IDS[(sequence - 1) % MANAGER_IDS.length]
        : null;
    const cancellationRequested =
      state.status === 'scheduled' && sequence % 19 === 0;

    await clinicDataSource.query(
      `INSERT INTO appointments
         (appointment_id, appointment_code, patient_id, doctor_id, clinic_id,
          room_id, service_id, appointment_date, appointment_time,
          duration_minutes, appointment_type, status, chief_complaint, notes,
          cancellation_reason, cancellation_requested, cancelled_by,
          cancelled_at, approved_by,
          payment_status, payment_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'consultation',$11,$12,$13,
               $14,$15,$16,$17,$18,'unpaid',NULL,$19)
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
         cancellation_reason = EXCLUDED.cancellation_reason,
         cancellation_requested = EXCLUDED.cancellation_requested,
         cancelled_by = EXCLUDED.cancelled_by,
         cancelled_at = EXCLUDED.cancelled_at,
         approved_by = EXCLUDED.approved_by,
         payment_status = EXCLUDED.payment_status,
         created_by = EXCLUDED.created_by`,
      [
        appointmentId,
        `APT-2026-${String(sequence).padStart(4, '0')}`,
        patientId,
        DOCTOR_IDS[doctorIndex],
        clinic.id,
        roomByClinicAndType[`${clinic.id}:${service[6]}`],
        serviceByCode[service[0]],
        dateOnly(state.date),
        time,
        service[4],
        state.status,
        clinicalProfiles[specialty].complaint,
        'Care instructions will be reviewed during the visit',
        state.cancellationReason,
        cancellationRequested,
        state.status === 'cancelled' ? patientAccountId : null,
        cancelledAt,
        approvedBy,
        createdBy,
      ],
    );

    appointments.push({
      sequence,
      appointmentId,
      patientId,
      patientAccountId,
      doctorId: DOCTOR_IDS[doctorIndex],
      clinicId: clinic.id,
      service,
      date: state.date,
      time,
      status: state.status,
      createdBy,
      approvedBy,
    });
  }
  return appointments;
}

async function seedClinicalRecords(
  appointments: SeededAppointment[],
): Promise<number> {
  let completedCount = 0;
  for (const appointment of appointments) {
    if (!shouldSeedCompletedEncounter(appointment.status)) continue;
    completedCount++;
    const profile = clinicalProfiles[appointment.service[3]];
    const recordId = fixedUuid('a4', appointment.sequence);
    const sessionId = fixedUuid('e1', appointment.sequence);
    const symptomId = fixedUuid('e2', appointment.sequence);
    const diagnosisId = fixedUuid('e3', appointment.sequence);
    const planId = fixedUuid('e4', appointment.sequence);
    const prescriptionId = fixedUuid('e5', appointment.sequence);
    const completedAt = timestampOn(appointment.date, appointment.time);

    await medicalDataSource.query(
      `INSERT INTO medical_records
         (record_id, patient_id, appointment_id, clinic_id, doctor_id,
          visit_date, chief_complaint, diagnosis, treatment_plan, notes,
          record_status, record_hash, finalized_at, finalized_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'finalized',$11,$12,$5)
       ON CONFLICT (record_id) DO UPDATE SET
         patient_id = EXCLUDED.patient_id,
         appointment_id = EXCLUDED.appointment_id,
         clinic_id = EXCLUDED.clinic_id,
         doctor_id = EXCLUDED.doctor_id,
         visit_date = EXCLUDED.visit_date,
         chief_complaint = EXCLUDED.chief_complaint,
         diagnosis = EXCLUDED.diagnosis,
         treatment_plan = EXCLUDED.treatment_plan,
         notes = EXCLUDED.notes,
         record_status = EXCLUDED.record_status,
         record_hash = EXCLUDED.record_hash,
         finalized_at = EXCLUDED.finalized_at,
         finalized_by = EXCLUDED.finalized_by`,
      [
        recordId,
        appointment.patientId,
        appointment.appointmentId,
        appointment.clinicId,
        appointment.doctorId,
        dateOnly(appointment.date),
        profile.complaint,
        profile.diagnosis,
        profile.objective,
        'Clinical findings and care options were reviewed with the patient',
        `MR-2026-${String(appointment.sequence).padStart(4, '0')}`,
        completedAt,
      ],
    );

    await medicalDataSource.query(
      `INSERT INTO examination_sessions
         (session_id, appointment_id, record_id, patient_id, doctor_id,
          clinic_id, session_date, chief_complaint, present_illness,
          physical_examination, vital_signs, status, started_at, completed_at,
          signed_at, signed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'completed',
               $7,$12,$12,$5)
       ON CONFLICT (session_id) DO UPDATE SET
         appointment_id = EXCLUDED.appointment_id,
         record_id = EXCLUDED.record_id,
         patient_id = EXCLUDED.patient_id,
         doctor_id = EXCLUDED.doctor_id,
         clinic_id = EXCLUDED.clinic_id,
         session_date = EXCLUDED.session_date,
         chief_complaint = EXCLUDED.chief_complaint,
         present_illness = EXCLUDED.present_illness,
         physical_examination = EXCLUDED.physical_examination,
         vital_signs = EXCLUDED.vital_signs,
         status = EXCLUDED.status,
         started_at = EXCLUDED.started_at,
         completed_at = EXCLUDED.completed_at,
         signed_at = EXCLUDED.signed_at,
         signed_by = EXCLUDED.signed_by`,
      [
        sessionId,
        appointment.appointmentId,
        recordId,
        appointment.patientId,
        appointment.doctorId,
        appointment.clinicId,
        completedAt,
        profile.complaint,
        profile.illness,
        profile.examination,
        JSON.stringify({
          temperatureCelsius: 36.7,
          pulsePerMinute: 72 + (appointment.sequence % 8),
          bloodPressure: '118/76',
        }),
        new Date(completedAt.getTime() + 45 * 60 * 1000),
      ],
    );

    await medicalDataSource.query(
      `INSERT INTO symptoms
         (symptom_id, session_id, patient_id, symptom_name, body_location,
          severity, onset_date, duration, description, recorded_by)
       VALUES ($1,$2,$3,$4,$5,'moderate',$6,'One to three weeks',$7,$8)
       ON CONFLICT (symptom_id) DO UPDATE SET
         session_id = EXCLUDED.session_id,
         patient_id = EXCLUDED.patient_id,
         symptom_name = EXCLUDED.symptom_name,
         body_location = EXCLUDED.body_location,
         severity = EXCLUDED.severity,
         onset_date = EXCLUDED.onset_date,
         duration = EXCLUDED.duration,
         description = EXCLUDED.description,
         recorded_by = EXCLUDED.recorded_by`,
      [
        symptomId,
        sessionId,
        appointment.patientId,
        profile.symptom,
        profile.location,
        dateOnly(addDays(appointment.date, -7)),
        profile.illness,
        appointment.doctorId,
      ],
    );

    await medicalDataSource.query(
      `INSERT INTO diagnoses
         (diagnosis_id, session_id, icd_code, diagnosis_name, diagnosis_type,
          severity, notes)
       VALUES ($1,$2,$3,$4,'primary','moderate',$5)
       ON CONFLICT (diagnosis_id) DO UPDATE SET
         session_id = EXCLUDED.session_id,
         icd_code = EXCLUDED.icd_code,
         diagnosis_name = EXCLUDED.diagnosis_name,
         diagnosis_type = EXCLUDED.diagnosis_type,
         severity = EXCLUDED.severity,
         notes = EXCLUDED.notes`,
      [
        diagnosisId,
        sessionId,
        profile.icd,
        profile.diagnosis,
        profile.examination,
      ],
    );

    await medicalDataSource.query(
      `INSERT INTO treatment_plans
         (plan_id, session_id, patient_id, record_id, plan_name, objectives,
          duration_weeks, status, estimated_cost, quote_currency, proposed_at,
          accepted_at, accepted_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'accepted',$8,'VND',$9,$9,$10,$11)
       ON CONFLICT (plan_id) DO UPDATE SET
         session_id = EXCLUDED.session_id,
         patient_id = EXCLUDED.patient_id,
         record_id = EXCLUDED.record_id,
         plan_name = EXCLUDED.plan_name,
         objectives = EXCLUDED.objectives,
         duration_weeks = EXCLUDED.duration_weeks,
         status = EXCLUDED.status,
         estimated_cost = EXCLUDED.estimated_cost,
         quote_currency = EXCLUDED.quote_currency,
         proposed_at = EXCLUDED.proposed_at,
         accepted_at = EXCLUDED.accepted_at,
         accepted_by = EXCLUDED.accepted_by,
         created_by = EXCLUDED.created_by`,
      [
        planId,
        sessionId,
        appointment.patientId,
        recordId,
        `${appointment.service[1]} Care Plan`,
        profile.objective,
        appointment.service[3] === 'ORTHO' ? 52 : 4,
        appointment.service[5],
        completedAt,
        appointment.patientAccountId,
        appointment.doctorId,
      ],
    );

    if (appointment.sequence % 3 === 0) {
      await medicalDataSource.query(
        `INSERT INTO prescriptions
           (prescription_id, session_id, record_id, patient_id, doctor_id,
            prescription_date, status, notes, issued_at, issued_by)
         VALUES ($1,$2,$3,$4,$5,$6,'issued',$7,$8,$5)
         ON CONFLICT (prescription_id) DO UPDATE SET
           session_id = EXCLUDED.session_id,
           record_id = EXCLUDED.record_id,
           patient_id = EXCLUDED.patient_id,
           doctor_id = EXCLUDED.doctor_id,
           prescription_date = EXCLUDED.prescription_date,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           issued_at = EXCLUDED.issued_at,
           issued_by = EXCLUDED.issued_by`,
        [
          prescriptionId,
          sessionId,
          recordId,
          appointment.patientId,
          appointment.doctorId,
          dateOnly(appointment.date),
          'Use after meals and report any unexpected reaction',
          completedAt,
        ],
      );
      await medicalDataSource.query(
        `INSERT INTO prescription_items
           (item_id, prescription_id, medication_name, medication_code,
            dosage, route, frequency, duration_days, quantity, instructions)
         VALUES ($1,$2,'Chlorhexidine Oral Rinse','CHX-012','15 milliliters',
                 'oral','Twice daily',7,1,$3)
         ON CONFLICT (item_id) DO UPDATE SET
           prescription_id = EXCLUDED.prescription_id,
           medication_name = EXCLUDED.medication_name,
           medication_code = EXCLUDED.medication_code,
           dosage = EXCLUDED.dosage,
           route = EXCLUDED.route,
           frequency = EXCLUDED.frequency,
           duration_days = EXCLUDED.duration_days,
           quantity = EXCLUDED.quantity,
           instructions = EXCLUDED.instructions`,
        [
          fixedUuid('e6', appointment.sequence),
          prescriptionId,
          'Rinse for thirty seconds, then spit out; do not swallow',
        ],
      );
    }

    await clinicDataSource.query(
      `UPDATE appointments
       SET session_id = $1, treatment_plan_id = $2
       WHERE appointment_code = $3`,
      [
        sessionId,
        planId,
        `APT-2026-${String(appointment.sequence).padStart(4, '0')}`,
      ],
    );
  }
  return completedCount;
}

async function runClinicSeed(): Promise<void> {
  console.log('Running Clinical EMR seed');
  try {
    await clinicDataSource.initialize();
    await medicalDataSource.initialize();

    const { specialtyByCode, serviceByCode, roomByClinicAndType } =
      await seedClinicReferenceData();
    await seedWorkforce(specialtyByCode, roomByClinicAndType);
    const patientIds = await seedPatients();
    const appointments = await seedAppointments(
      patientIds,
      serviceByCode,
      roomByClinicAndType,
    );
    const completedRecords = await seedClinicalRecords(appointments);
    const featureCounts = await seedClinicOperationalData(
      clinicDataSource,
      appointments,
      patientIds,
      MANAGER_IDS,
      NURSE_IDS,
    );
    const medicalFeatureCounts = await seedMedicalFeatureData(
      medicalDataSource,
      appointments,
      patientIds,
      NURSE_IDS,
      ADMIN_ID,
    );

    console.log('Clinical EMR seed completed', {
      clinics: clinics.length,
      rooms: clinics.length * 6,
      specialties: specialties.length,
      clinicSpecialties: clinicSpecialtyCodes.reduce(
        (total, codes) => total + codes.length,
        0,
      ),
      categories: categories.length,
      services: services.length,
      doctorSpecialties: doctorProfiles.length,
      leaves: LEAVE_COUNT,
      patients: patientIds.length,
      appointments: appointments.length,
      completedRecords,
      ...featureCounts,
      ...medicalFeatureCounts,
    });
  } catch (error) {
    const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
    console.error('Clinical EMR seed failed', {
      operation: 'seed_clinical_emr_data',
      error_class: errorClass,
      error_code: errorCode,
    });
    process.exitCode = 1;
  } finally {
    if (clinicDataSource.isInitialized) await clinicDataSource.destroy();
    if (medicalDataSource.isInitialized) await medicalDataSource.destroy();
  }
}

void runClinicSeed();
