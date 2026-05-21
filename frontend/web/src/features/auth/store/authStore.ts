import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/features/auth/types/auth.type';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (authData: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (authData) => set({ 
        user: authData.user, 
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken 
      }),
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null 
      }),
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken,
        user: state.user 
      }),
    }
  )
);