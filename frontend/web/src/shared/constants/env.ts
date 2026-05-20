export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'http://localhost:8081/api/account',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),

  SERVICES: {
    ACCOUNT: process.env.NEXT_PUBLIC_ACCOUNT_API_URL,
    CLINIC: process.env.NEXT_PUBLIC_CLINIC_API_URL,
    APPOINTMENT: process.env.NEXT_PUBLIC_APPOINTMENT_API_URL,
    PATIENT_MEDIA_RECORD: process.env.NEXT_PUBLIC_PATIENT_MEDIA_RECORD_API_URL,
    SCHEDULE: process.env.NEXT_PUBLIC_SCHEDULE_API_URL,
    SERVICE: process.env.NEXT_PUBLIC_SERVICE_API_URL,
    EXAMINATION: process.env.NEXT_PUBLIC_EXAMINATION_API_URL,
    DENTAL_IMAGE: process.env.NEXT_PUBLIC_DENTAL_IMAGE_API_URL,
  }
} as const;

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
