import { ENV } from "@/shared/constants/env";

const ACCOUNT_BASE = ENV.SERVICES.ACCOUNT || "http://localhost:8080/api/v1";
const CLINIC_BASE = ENV.SERVICES.CLINIC || "http://localhost:8082/api/v1";
const APPOINTMENT_BASE =
  ENV.SERVICES.APPOINTMENT || "http://localhost:8083/api/appointment";
const PATIENT_BASE =
  ENV.SERVICES.PATIENT_MEDIA_RECORD ||
  "http://localhost:8084/api/patient-media-record";
const SCHEDULE_BASE =
  ENV.SERVICES.SCHEDULE || "http://localhost:8085/api/schedule";
const SERVICE_BASE =
  ENV.SERVICES.SERVICE || "http://localhost:8086/api/service";
const EXAMINATION_BASE =
  ENV.SERVICES.EXAMINATION || "http://localhost:8087/api/examination";
const DENTAL_IMAGE_BASE =
  ENV.SERVICES.DENTAL_IMAGE || "http://localhost:8088/api/dental-image";

export const API_ENDPOINTS = {
  // ACCOUNT SERVICE
  AUTH: {
    LOGIN: `${ACCOUNT_BASE}/auth/email/login`,
    REGISTER: `${ACCOUNT_BASE}/auth/email/register`,
    LOGOUT: `${ACCOUNT_BASE}/auth/logout`,
    REFRESH: `${ACCOUNT_BASE}/auth/refresh`,
    FORGOT_PASSWORD: `${ACCOUNT_BASE}/auth/forgot/password`,
    RESET_PASSWORD: `${ACCOUNT_BASE}/auth/reset/password`,
    CHANGE_PASSWORD: `${ACCOUNT_BASE}/auth/change-password`,

    // OTP
    SEND_OTP: `${ACCOUNT_BASE}/auth/otp/send`,
    VERIFY_OTP: `${ACCOUNT_BASE}/auth/otp/verify`,
    VERIFY_EMAIL: `${ACCOUNT_BASE}/auth/email/confirm`,
    VERIFY_PHONE: `${ACCOUNT_BASE}/auth/verify-phone`,
  },

  USER: {
    ME: `${ACCOUNT_BASE}/accounts/me`,
    UPDATE_PROFILE: `${ACCOUNT_BASE}/accounts/me`,
  },

  ROLE: {
    LIST: `${ACCOUNT_BASE}/roles`,
  },

  OAUTH: {
    GOOGLE: `${ACCOUNT_BASE}/oauth/google`,
  },

  // ADMIN
  ADMIN: {
    USERS: {
      LIST: `${ACCOUNT_BASE}/users`,
      LOCK: (userId: string) => `${ACCOUNT_BASE}/users/${userId}/lock`,
      UNLOCK: (userId: string) => `${ACCOUNT_BASE}/users/${userId}/unlock`,
      UPDATE_ROLES: (userId: string) => `${ACCOUNT_BASE}/users/${userId}/roles`,
    },
    USER_PROFILES: {
      LIST: `${ACCOUNT_BASE}/user-profiles`,
      BAN: (id: string) => `${ACCOUNT_BASE}/user-profiles/${id}/ban`,
      UNBAN: (id: string) => `${ACCOUNT_BASE}/user-profiles/${id}/unban`,
    },
    USER_ROLES: {
      BY_USER: (userId: string) => `${ACCOUNT_BASE}/user-roles/user/${userId}`,
      ASSIGN: (userId: string) => `${ACCOUNT_BASE}/user-roles/user/${userId}`,
      REVOKE: (userId: string, roleId: string) =>
        `${ACCOUNT_BASE}/user-roles/user/${userId}/role/${roleId}`,
    },
    ROLES: {
      LIST: `${ACCOUNT_BASE}/roles`,
      DETAIL: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
      BY_NAME: (roleName: string) => `${ACCOUNT_BASE}/roles/name/${roleName}`,
      CREATE: `${ACCOUNT_BASE}/roles`,
      UPDATE: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
      DELETE: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
      PERMISSIONS: (roleId: string) =>
        `${ACCOUNT_BASE}/roles/${roleId}/permissions`,
      UPDATE_PERMISSIONS: (roleId: string) =>
        `${ACCOUNT_BASE}/roles/${roleId}/permissions`,
      ADD_PERMISSION: (roleId: string, permissionId: string) =>
        `${ACCOUNT_BASE}/roles/${roleId}/permissions/${permissionId}`,
      REMOVE_PERMISSION: (roleId: string, permissionId: string) =>
        `${ACCOUNT_BASE}/roles/${roleId}/permissions/${permissionId}`,
    },
    PERMISSIONS: {
      LIST: `${ACCOUNT_BASE}/roles/permissions`,
      DETAIL: (permissionId: string) =>
        `${ACCOUNT_BASE}/roles/permissions/${permissionId}`,
    },
    // Direct permission management via /v1/permissions
    PERMISSIONS_V1: {
      LIST: `${ACCOUNT_BASE}/permissions`,
      CREATE: `${ACCOUNT_BASE}/permissions`,
      DETAIL: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
      UPDATE: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
      DELETE: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
      BY_ROLE: (roleId: string) => `${ACCOUNT_BASE}/permissions/role/${roleId}`,
      ASSIGN_TO_ROLE: (roleId: string) =>
        `${ACCOUNT_BASE}/permissions/role/${roleId}`,
      REVOKE_FROM_ROLE: (roleId: string, permissionId: string) =>
        `${ACCOUNT_BASE}/permissions/role/${roleId}/${permissionId}`,
    },
    AUDIT_LOGS: {
      LIST: `${ACCOUNT_BASE}/audit-logs`,
    },
  },

  // CLINIC SERVICE
  CLINIC: {
    LIST: `${CLINIC_BASE}/clinics`,
    DETAIL: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
    BY_CODE: (code: string) => `${CLINIC_BASE}/clinics/code/${code}`,
    CREATE: `${CLINIC_BASE}/clinics`,
    UPDATE: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
    DELETE: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
    SEARCH: `${CLINIC_BASE}/clinics/search`,
    STATS_BY_STATUS: (status: string) =>
      `${CLINIC_BASE}/clinics/stats/status/${status}`,
  },

  TREATMENT_ROOM: {
    BY_CLINIC: (clinicId: string) =>
      `${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms`,
    DETAIL: (clinicId: string, roomId: string) =>
      `${CLINIC_BASE}/treatment-rooms/${roomId}`,
    BY_CODE: (clinicId: string, code: string) =>
      `${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms/code/${code}`,
    CREATE: (clinicId: string) =>
      `${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms`,
    UPDATE: (clinicId: string, roomId: string) =>
      `${CLINIC_BASE}/treatment-rooms/${roomId}`,
    DELETE: (clinicId: string, roomId: string) =>
      `${CLINIC_BASE}/treatment-rooms/${roomId}`,
    SEARCH: (clinicId: string) =>
      `${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms/search`,
    AVAILABILITY: (id: string) =>
      `${CLINIC_BASE}/treatment-rooms/${id}/availability`,
  },

  // APPOINTMENT SERVICE
  APPOINTMENT: {
    CREATE_BY_CLINIC: `${APPOINTMENT_BASE}/clinic`,
    CREATE_BY_SPECIALTY: `${APPOINTMENT_BASE}/specialty`,
    CREATE_BY_DOCTOR: `${APPOINTMENT_BASE}/doctor`,
    CREATE_OUTSIDE_HOURS: `${APPOINTMENT_BASE}/outside-hours`,

    BY_CLINIC: (clinicId: string) => `${APPOINTMENT_BASE}/clinic/${clinicId}`,
    BY_DOCTOR: (doctorId: string) => `${APPOINTMENT_BASE}/doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) =>
      `${APPOINTMENT_BASE}/patient/${patientId}`,
    BY_DATE_RANGE: `${APPOINTMENT_BASE}/date-range`,

    DETAIL: (id: string) => `${APPOINTMENT_BASE}/${id}`,
    BY_CODE: (code: string) => `${APPOINTMENT_BASE}/code/${code}`,
    UPDATE: (id: string) => `${APPOINTMENT_BASE}/${id}`,
    CANCEL: (id: string) => `${APPOINTMENT_BASE}/${id}/cancel`,
    CONFIRM: (id: string) => `${APPOINTMENT_BASE}/${id}/confirm`,

    CHECK_AVAILABILITY_DOCTOR: (doctorId: string) =>
      `${APPOINTMENT_BASE}/availability/doctor/${doctorId}`,
    CHECK_AVAILABILITY_CLINIC: (clinicId: string) =>
      `${APPOINTMENT_BASE}/availability/clinic/${clinicId}`,
  },

  VNPAY: {
    CREATE_PAYMENT: `${APPOINTMENT_BASE}/vnpay/create-payment`,
    RETURN: `${APPOINTMENT_BASE}/vnpay/return`,
  },

  REMINDER: {
    SEND: `${APPOINTMENT_BASE}/reminders/send`,
  },

  // PATIENT MEDIA RECORD SERVICE
  PATIENT: {
    LIST: `${PATIENT_BASE}/patients`,
    DETAIL: (id: string) => `${PATIENT_BASE}/patients/${id}`,
    CREATE: `${PATIENT_BASE}/patients`,
    UPDATE: (id: string) => `${PATIENT_BASE}/patients/${id}`,
  },

  MEDICAL_RECORD: {
    BY_PATIENT: (patientId: string) =>
      `${PATIENT_BASE}/medical-records/patient/${patientId}`,
    LIST_BY_PATIENT: (patientId: string) =>
      `${PATIENT_BASE}/medical-records/patient/${patientId}/search`,
    DETAIL: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
    CREATE: `${PATIENT_BASE}/medical-records`,
    UPDATE: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
    DELETE: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
  },

  TREATMENT_HISTORY: {
    CREATE: `${PATIENT_BASE}/treatment-history`,
    BY_PATIENT: (patientId: string) =>
      `${PATIENT_BASE}/treatment-history/patient/${patientId}`,
    UPDATE: (treatmentId: string) =>
      `${PATIENT_BASE}/treatment-history/${treatmentId}`,
    DELETE: (treatmentId: string) =>
      `${PATIENT_BASE}/treatment-history/${treatmentId}`,
  },

  MEDICAL_HISTORY: {
    CREATE: `${PATIENT_BASE}/medical-history`,
    BY_PATIENT: (patientId: string) =>
      `${PATIENT_BASE}/medical-history/patient/${patientId}`,
    UPDATE: (historyId: string) =>
      `${PATIENT_BASE}/medical-history/${historyId}`,
    DELETE: (historyId: string) =>
      `${PATIENT_BASE}/medical-history/${historyId}`,
  },

  BLOCKCHAIN: {
    VERIFY: (recordId: string) =>
      `${PATIENT_BASE}/blockchain/verify/${recordId}`,
    AUDIT: (patientId: string) =>
      `${PATIENT_BASE}/blockchain/audit/${patientId}`,
  },

  // SCHEDULE SERVICE
  SCHEDULE: {
    LIST: `${SCHEDULE_BASE}/doctor-schedules`,
    DETAIL: (scheduleId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
    BY_DOCTOR: (doctorId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/doctor/${doctorId}`,
    BY_CLINIC: (clinicId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/clinic/${clinicId}`,
    CREATE: `${SCHEDULE_BASE}/doctor-schedules`,
    UPDATE: (scheduleId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
    CANCEL: (scheduleId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/cancel`,
    COMPLETE: (scheduleId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/complete`,
    DELETE: (scheduleId: string) =>
      `${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
    STATISTICS: `${SCHEDULE_BASE}/doctor-schedules/statistics`,
  },

  WORK_SHIFT: {
    LIST: `${SCHEDULE_BASE}/work-shifts`,
    DETAIL: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
    CREATE: `${SCHEDULE_BASE}/work-shifts`,
    UPDATE: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
    DELETE: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
  },

  DOCTOR_LEAVE: {
    LIST: `${SCHEDULE_BASE}/doctor-leaves`,
    DETAIL: (leaveId: string) => `${SCHEDULE_BASE}/doctor-leaves/${leaveId}`,
    BY_DOCTOR: (doctorId: string) =>
      `${SCHEDULE_BASE}/doctor-leaves/doctor/${doctorId}`,
    CREATE: `${SCHEDULE_BASE}/doctor-leaves`,
    APPROVE: (leaveId: string) =>
      `${SCHEDULE_BASE}/doctor-leaves/${leaveId}/approve`,
    REJECT: (leaveId: string) =>
      `${SCHEDULE_BASE}/doctor-leaves/${leaveId}/reject`,
    DELETE: (leaveId: string) => `${SCHEDULE_BASE}/doctor-leaves/${leaveId}`,
    STATISTICS: `${SCHEDULE_BASE}/doctor-leaves/statistics`,
  },

  SCHEDULE_CHANGE: {
    LIST: `${SCHEDULE_BASE}/schedule-changes`,
    DETAIL: (changeId: string) =>
      `${SCHEDULE_BASE}/schedule-changes/${changeId}`,
    CREATE: `${SCHEDULE_BASE}/schedule-changes`,
    APPROVE: (changeId: string) =>
      `${SCHEDULE_BASE}/schedule-changes/${changeId}/approve`,
    REJECT: (changeId: string) =>
      `${SCHEDULE_BASE}/schedule-changes/${changeId}/reject`,
  },

  SCHEDULE_NOTIFICATION: {
    BY_RECIPIENT: (recipientId: string) =>
      `${SCHEDULE_BASE}/notifications/recipient/${recipientId}`,
    SEND: `${SCHEDULE_BASE}/notifications`,
    MARK_READ: (notificationId: string) =>
      `${SCHEDULE_BASE}/notifications/${notificationId}/read`,
    SEND_REMINDER: (scheduleId: string) =>
      `${SCHEDULE_BASE}/notifications/reminder/${scheduleId}`,
  },

  // SERVICE SERVICE
  SERVICE: {
    LIST: `${SERVICE_BASE}/services`,
    DETAIL: (id: string) => `${SERVICE_BASE}/services/${id}`,
    BY_SPECIALTY: (specialtyId: string) =>
      `${SERVICE_BASE}/services/specialty/${specialtyId}`,
    SEARCH: `${SERVICE_BASE}/services/search`,
    CREATE: `${SERVICE_BASE}/services`,
    UPDATE: (id: string) => `${SERVICE_BASE}/services/${id}`,
    DELETE: (id: string) => `${SERVICE_BASE}/services/${id}`,
  },

  SPECIALTY: {
    LIST: `${SERVICE_BASE}/specialties`,
    DETAIL: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
    CREATE: `${SERVICE_BASE}/specialties`,
    UPDATE: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
    DELETE: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
  },

  SERVICE_CATEGORY: {
    LIST: `${SERVICE_BASE}/categories`,
    DETAIL: (id: string) => `${SERVICE_BASE}/categories/${id}`,
    CREATE: `${SERVICE_BASE}/categories`,
    UPDATE: (id: string) => `${SERVICE_BASE}/categories/${id}`,
    DELETE: (id: string) => `${SERVICE_BASE}/categories/${id}`,
  },

  // EXAMINATION SERVICE
  EXAMINATION: {
    BY_APPOINTMENT: (appointmentId: string) =>
      `${EXAMINATION_BASE}/sessions/appointment/${appointmentId}`,
    BY_PATIENT: (patientId: string) =>
      `${EXAMINATION_BASE}/sessions/patient/${patientId}`,
    CREATE: `${EXAMINATION_BASE}/sessions`,
    UPDATE: (id: string) => `${EXAMINATION_BASE}/sessions/${id}`,
  },

  DIAGNOSIS: {
    BY_SESSION: (sessionId: string) =>
      `${EXAMINATION_BASE}/diagnoses/session/${sessionId}`,
    CREATE: `${EXAMINATION_BASE}/diagnoses`,
    UPDATE: (id: string) => `${EXAMINATION_BASE}/diagnoses/${id}`,
  },

  PRESCRIPTION: {
    BY_SESSION: (sessionId: string) =>
      `${EXAMINATION_BASE}/prescriptions/session/${sessionId}`,
    CREATE: `${EXAMINATION_BASE}/prescriptions`,
  },

  TREATMENT_PLAN: {
    BY_PATIENT: (patientId: string) =>
      `${EXAMINATION_BASE}/treatment-plans/patient/${patientId}`,
    CREATE: `${EXAMINATION_BASE}/treatment-plans`,
  },

  // DENTAL IMAGE SERVICE
  DENTAL_IMAGE: {
    UPLOAD: `${DENTAL_IMAGE_BASE}/images/upload`,
    UPLOAD_BATCH: `${DENTAL_IMAGE_BASE}/images/upload/batch`,
    BY_PATIENT: (patientId: string) =>
      `${DENTAL_IMAGE_BASE}/images/patient/${patientId}`,
    DETAIL: (id: string) => `${DENTAL_IMAGE_BASE}/images/${id}`,
    DOWNLOAD: (id: string) => `${DENTAL_IMAGE_BASE}/images/${id}/download`,
    BY_CATEGORY: (categoryId: string) =>
      `${DENTAL_IMAGE_BASE}/images/category/${categoryId}`,
    UPDATE: (id: string) => `${DENTAL_IMAGE_BASE}/images/${id}`,
    DELETE: (id: string) => `${DENTAL_IMAGE_BASE}/images/${id}`,

    ANALYZE: (id: string) => `${DENTAL_IMAGE_BASE}/images/${id}/analyze`,
    ANALYSIS_RESULT: (id: string) =>
      `${DENTAL_IMAGE_BASE}/images/${id}/analysis`,
  },

  IMAGE_CATEGORY: {
    LIST: `${DENTAL_IMAGE_BASE}/categories`,
    CREATE: `${DENTAL_IMAGE_BASE}/categories`,
  },
} as const;
