export const ROUTES = {
  // LANDING PAGE
  HOME: "/",

  // AUTH
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // User
  DASHBOARD: "/dashboard",
  CHAT: "/chat",
  PROFILE: "/profile",

  // Admin
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users-management",
  ADMIN_ROLES: "/admin/roles-management",
  ADMIN_KYC: "/admin/kyc-management",

  // Clinics
  CLINICS: "/clinics",
  CLINIC_DETAIL: (id: string) => `/clinics/${id}`,
  CLINIC_NEW: "/clinics/new",
  CLINIC_EDIT: (id: string) => `/clinics/${id}/edit`,

  // Appointments
  APPOINTMENTS: "/appointments",
  APPOINTMENT_NEW: "/appointments/new",
  APPOINTMENT_DETAIL: (id: string) => `/appointments/${id}`,
  APPOINTMENT_EDIT: (id: string) => `/appointments/${id}/edit`,
  APPOINTMENT_PAYMENT: (id: string) => `/appointments/${id}/payment`,

  // Patient routes
  PATIENTS: "/patients",
  PATIENT_NEW: "/patients/new",
  PATIENT_DETAIL: (id: string) => `/patients/${id}`,
  PATIENT_EDIT: (id: string) => `/patients/${id}/edit`,
  PATIENT_MEDICAL_RECORDS: (id: string) => `/patients/${id}/medical-records`,
  PATIENT_TREATMENT_HISTORY: (id: string) =>
    `/patients/${id}/treatment-history`,
  PATIENT_IMAGES: (id: string) => `/patients/${id}/images`,

  // Service routes
  SERVICES: "/services",
  SERVICE_NEW: "/services/new",
  SERVICE_EDIT: (id: string) => `/services/${id}/edit`,
  SERVICE_DETAIL: (id: string) => `/services/${id}`,

  // Specialty routes
  SPECIALTIES: "/specialties",
  SPECIALTY_DETAIL: (id: string) => `/specialties/${id}`,

  // Schedule routes
  SCHEDULES: "/schedules",

  // Doctor schedule routes
  DOCTOR_SCHEDULES: "/schedules/doctors",
  DOCTOR_SCHEDULE_DETAIL: (doctorId: string) =>
    `/schedules/doctors/${doctorId}`,
  DOCTOR_SCHEDULE_NEW: "/schedules/doctors/new",
  DOCTOR_SCHEDULE_EDIT: (scheduleId: string) =>
    `/schedules/doctors/edit/${scheduleId}`,

  // Work shift routes
  WORK_SHIFTS: "/schedules/shifts",
  WORK_SHIFT_NEW: "/schedules/shifts/new",
  WORK_SHIFT_EDIT: (shiftId: string) => `/schedules/shifts/${shiftId}/edit`,

  // Leave routes
  DOCTOR_LEAVES: "/schedules/leaves",
  DOCTOR_LEAVE_NEW: "/schedules/leaves/new",
  DOCTOR_LEAVE_DETAIL: (leaveId: string) => `/schedules/leaves/${leaveId}`,

  // Schedule changes routes
  SCHEDULE_CHANGES: "/schedules/changes",
  SCHEDULE_CHANGE_DETAIL: (changeId: string) =>
    `/schedules/changes/${changeId}`,

  // Personal schedule (for doctors)
  MY_SCHEDULE: "/schedules/my-schedule",

  // Examinations
  EXAMINATIONS: "/examinations",
  EXAMINATION_DETAIL: (id: string) => `/examinations/${id}`,
  EXAMINATION_NEW: "/examinations/new",

  // Records
  RECORDS: "/records",

  // Payments
  PAYMENTS: "/payments",

  // Internal Notes
  INTERNAL_NOTES: "/internal-notes",

  // Admin extended
  ADMIN_CLINICS: "/admin/clinics",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  ADMIN_REVENUE: "/admin/revenue-reports",

  // Settings & misc
  SETTINGS: "/settings",
  TEST: "/test",

  // ERROR
  UNAUTHORIZED: "/unauthorized",
};

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_ROLES,
  ROUTES.ADMIN_KYC,
  ROUTES.WORK_SHIFTS,
  ROUTES.SCHEDULE_CHANGES,
];

export const DOCTOR_ROUTES = [ROUTES.MY_SCHEDULE, ROUTES.DOCTOR_LEAVES];

export const RECEPTIONIST_ROUTES = [
  ROUTES.APPOINTMENTS,
  ROUTES.PATIENTS,
  ROUTES.PAYMENTS,
];

export const NURSE_ROUTES = [ROUTES.APPOINTMENTS];

/** Routes that should redirect if already authenticated */
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];
