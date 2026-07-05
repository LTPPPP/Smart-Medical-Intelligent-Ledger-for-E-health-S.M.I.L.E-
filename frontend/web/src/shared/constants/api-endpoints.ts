// ============================================================
// API endpoint path constants
// ============================================================

const API_V1 = "/api/v1";

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_V1}/auth/login`,
    REGISTER: `${API_V1}/auth/register`,
    REFRESH: `${API_V1}/auth/refresh`,
    LOGOUT: `${API_V1}/auth/logout`,
    ME: `${API_V1}/auth/me`,
    FORGOT_PASSWORD: `${API_V1}/auth/forgot-password`,
    RESET_PASSWORD: `${API_V1}/auth/reset-password`,
    VERIFY_OTP: `${API_V1}/auth/verify-otp`,
    OAUTH_GOOGLE: `${API_V1}/auth/google`,
    OAUTH_FACEBOOK: `${API_V1}/auth/facebook`,
    OAUTH_APPLE: `${API_V1}/auth/apple`,
  },

  // Users
  USERS: {
    LIST: `${API_V1}/users`,
    DETAIL: (id: string) => `${API_V1}/users/${id}`,
    UPDATE: (id: string) => `${API_V1}/users/${id}`,
    DELETE: (id: string) => `${API_V1}/users/${id}`,
  },

  // Patients
  PATIENTS: {
    LIST: `${API_V1}/patients`,
    DETAIL: (id: string) => `${API_V1}/patients/${id}`,
    CREATE: `${API_V1}/patients`,
    UPDATE: (id: string) => `${API_V1}/patients/${id}`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: `${API_V1}/appointments`,
    DETAIL: (id: string) => `${API_V1}/appointments/${id}`,
    CREATE: `${API_V1}/appointments`,
    UPDATE: (id: string) => `${API_V1}/appointments/${id}`,
    CANCEL: (id: string) => `${API_V1}/appointments/${id}/cancel`,
    SLOTS: `${API_V1}/appointments/slots`,
  },

  // Examinations / Medical Records
  EXAMINATIONS: {
    LIST: `${API_V1}/examinations`,
    DETAIL: (id: string) => `${API_V1}/examinations/${id}`,
    CREATE: `${API_V1}/examinations`,
  },

  // Medical Images / AI
  IMAGES: {
    UPLOAD: `${API_V1}/dental-image/upload`,
    ANALYZE: `${API_V1}/dental-image/analyze`,
    DETAIL: (id: string) => `${API_V1}/dental-image/${id}`,
  },

  // Prescriptions
  PRESCRIPTIONS: {
    LIST: `${API_V1}/prescriptions`,
    DETAIL: (id: string) => `${API_V1}/prescriptions/${id}`,
    CREATE: `${API_V1}/prescriptions`,
  },

  // Payments
  PAYMENTS: {
    LIST: `${API_V1}/payments`,
    CREATE_VNPAY: `${API_V1}/payments/vnpay/create`,
    VNPAY_CALLBACK: `${API_V1}/payments/vnpay/callback`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_V1}/notifications`,
    PREFERENCES: `${API_V1}/notifications/preferences`,
    MARK_READ: (id: string) => `${API_V1}/notifications/${id}/read`,
  },

  // Admin
  ADMIN: {
    CLINICS: `${API_V1}/admin/clinics`,
    CLINIC_DETAIL: (id: string) => `${API_V1}/admin/clinics/${id}`,
    AUDIT_LOGS: `${API_V1}/admin/audit-logs`,
  },
} as const;
