declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_ACCOUNT_API_URL: string;
    
    NEXT_PUBLIC_API_TIMEOUT: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}