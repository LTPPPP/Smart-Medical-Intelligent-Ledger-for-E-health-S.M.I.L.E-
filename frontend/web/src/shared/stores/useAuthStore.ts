// ============================================================
// Auth store — Zustand (UI state only, not server data)
// Access token stored in-memory (never localStorage per security rules)
// ============================================================

import { create } from "zustand";

import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true initially until we check auth
};

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set(initialState),
}));

// ─── Typed selectors (never expose full store) ──────────────
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useUserRole = () => useAuthStore((s) => s.user?.role ?? null);
