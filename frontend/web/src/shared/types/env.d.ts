declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_ACCOUNT_API_URL: string;
    NEXT_PUBLIC_CLINIC_API_URL: string;
    NEXT_PUBLIC_APPOINTMENT_API_URL: string;
    NEXT_PUBLIC_PATIENT_MEDIA_RECORD_API_URL: string;
    NEXT_PUBLIC_SCHEDULE_API_URL: string;
    NEXT_PUBLIC_SERVICE_API_URL: string;
    NEXT_PUBLIC_EXAMINATION_API_URL: string;
    NEXT_PUBLIC_DENTAL_IMAGE_API_URL: string;
    
    NEXT_PUBLIC_API_TIMEOUT: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}