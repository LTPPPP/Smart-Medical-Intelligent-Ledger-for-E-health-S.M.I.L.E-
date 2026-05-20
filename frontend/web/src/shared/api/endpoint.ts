import { ENV } from '@/shared/constants/env';

const ACCOUNT_BASE =
  ENV.SERVICES.ACCOUNT || 'http://localhost:8081/api/account';

export const API_ENDPOINTS = {
  // ACCOUNT SERVICE
  AUTH: {
    LOGIN: `${ACCOUNT_BASE}/auth/login`,
    REGISTER: `${ACCOUNT_BASE}/auth/register`,
    LOGOUT: `${ACCOUNT_BASE}/auth/logout`,
    REFRESH: `${ACCOUNT_BASE}/auth/refresh`,
    FORGOT_PASSWORD: `${ACCOUNT_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${ACCOUNT_BASE}/auth/reset-password`,
    CHANGE_PASSWORD: `${ACCOUNT_BASE}/auth/change-password`,

    // OTP
    SEND_OTP: `${ACCOUNT_BASE}/auth/otp/send`,
    VERIFY_OTP: `${ACCOUNT_BASE}/auth/otp/verify`,
    VERIFY_EMAIL: `${ACCOUNT_BASE}/auth/verify-email`,
    VERIFY_PHONE: `${ACCOUNT_BASE}/auth/verify-phone`,
  },

  USER: {
    ME: `${ACCOUNT_BASE}/users/profile`,
    // UPDATE_PROFILE: `${ACCOUNT_BASE}/users/me`,
    UPDATE_PROFILE: `${ACCOUNT_BASE}/users/profile`,
  },

} as const;
