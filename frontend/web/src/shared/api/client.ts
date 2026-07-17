import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ENV } from '@/shared/constants/env';
import { ROUTES } from '@/shared/constants/routes';

export const apiClient: AxiosInstance = axios.create({
  timeout: ENV.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false
}); 

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // GET: token from Zustand store
    const { accessToken } = useAuthStore.getState();
    
    if (config.headers) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      // if (user?.userId) {
      //   config.headers['X-User-ID'] = user.userId;
      // }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  }
);
