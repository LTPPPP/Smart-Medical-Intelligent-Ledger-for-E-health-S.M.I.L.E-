export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'http://localhost:8081/api/account',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),

  SERVICES: {
    ACCOUNT: process.env.NEXT_PUBLIC_ACCOUNT_API_URL,
  }
} as const;

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
