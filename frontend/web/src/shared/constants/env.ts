// All backend traffic goes through the API Gateway (gateway-service), which proxies
// /api/v1/<resource> to the underlying microservices. The per-service URLs below all
// default to the gateway base so the FE talks to a single origin in dev.
const GATEWAY_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_ACCOUNT_API_URL ||
  'http://localhost:8080/api/v1';

export const ENV = {
  API_URL: GATEWAY_BASE,
  GATEWAY_URL: GATEWAY_BASE,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',

  // Chatbot (booking orchestrator) — direct service URL (FastAPI), not behind gateway.
  CHATBOT_URL:
    process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:8089',

  SERVICES: {
    GATEWAY: GATEWAY_BASE,
    ACCOUNT: process.env.NEXT_PUBLIC_ACCOUNT_API_URL || GATEWAY_BASE,
    CLINIC: process.env.NEXT_PUBLIC_CLINIC_API_URL || GATEWAY_BASE,
    APPOINTMENT: process.env.NEXT_PUBLIC_APPOINTMENT_API_URL || GATEWAY_BASE,
    PATIENT_MEDIA_RECORD:
      process.env.NEXT_PUBLIC_PATIENT_MEDIA_RECORD_API_URL || GATEWAY_BASE,
    SCHEDULE: process.env.NEXT_PUBLIC_SCHEDULE_API_URL || GATEWAY_BASE,
    SERVICE: process.env.NEXT_PUBLIC_SERVICE_API_URL || GATEWAY_BASE,
    EXAMINATION: process.env.NEXT_PUBLIC_EXAMINATION_API_URL || GATEWAY_BASE,
    DENTAL_IMAGE: process.env.NEXT_PUBLIC_DENTAL_IMAGE_API_URL || GATEWAY_BASE,
    PAYMENT: process.env.NEXT_PUBLIC_PAYMENT_API_URL || GATEWAY_BASE,
  },
} as const;

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
