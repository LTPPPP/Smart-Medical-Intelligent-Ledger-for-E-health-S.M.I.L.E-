const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'src/shared/components/layout/OperationsLayout.tsx',
  'src/app/(pages)/appointments/page.tsx',
  'src/app/(pages)/clinics/page.tsx',
  'src/app/(pages)/patients/page.tsx',
  'src/app/(pages)/services/page.tsx',
  'src/app/(pages)/examinations/page.tsx',
  'src/app/(pages)/schedules/page.tsx',
  'src/app/(pages)/schedules/doctors/page.tsx',
  'src/app/(pages)/schedules/leaves/page.tsx',
  'src/features/patient/components/PatientList.tsx',
  'src/features/patient/components/PatientCard.tsx',
  'src/features/appointment/components/AppointmentCard.tsx',
  'src/features/appointment/components/AppointmentFilters.tsx',
  'src/features/service/components/ServiceCard.tsx',
  'src/features/schedule/components/ScheduleCard.tsx',
  'src/features/schedule/components/ScheduleCalendar.tsx',
  'src/features/schedule/components/LeaveRequestCard.tsx',
  'src/features/clinic/components/TreatmentRoomsList.tsx',
  'src/features/appointment/constants/appointment.constant.ts',
  'src/features/service/constants/service.constant.ts',
  'src/features/clinic/constants/clinic.constant.ts',
];

const forbiddenPatterns = [
  /\b(?:bg|text|border|ring|from|to|via)-(?:teal|slate|emerald|amber)-/g,
  /\b(?:bg|text|border|ring|from|to|via)-(?:blue|gray)-/g,
  /\bbg-gradient-to-/g,
  /\bshadow-(?:md|lg|2xl)\b/g,
  /API did not return|navigation QA|flow validation|hiển thị dữ liệu demo/gi,
];

let failed = false;

for (const relative of files) {
  const absolute = path.join(root, relative);
  const source = fs.readFileSync(absolute, 'utf8');

  for (const pattern of forbiddenPatterns) {
    const matches = source.match(pattern);
    if (matches) {
      failed = true;
      console.error(`${relative}: forbidden UI pattern ${pattern} -> ${[...new Set(matches)].join(', ')}`);
    }
  }
}

const operationsLayout = fs.readFileSync(
  path.join(root, 'src/shared/components/layout/OperationsLayout.tsx'),
  'utf8',
);

for (const token of ['--surface-panel-bg', '--surface-card-bg', '--surface-input-bg']) {
  if (!operationsLayout.includes(token)) {
    failed = true;
    console.error(`OperationsLayout.tsx: missing design token ${token}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('UI style smoke passed');
