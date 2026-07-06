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

/** Presence-only cookie so the edge middleware can gate routes; auth store
 *  (localStorage) remains the source of truth for the actual token. */
const AUTH_COOKIE = 'access_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (authData) => {
        setAuthCookie();
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken
        });
      },
      logout: () => {
        clearAuthCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null
        });
      },
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