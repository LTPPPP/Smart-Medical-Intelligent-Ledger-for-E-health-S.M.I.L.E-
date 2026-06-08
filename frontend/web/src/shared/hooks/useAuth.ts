// ============================================================
// useAuth hook — wraps auth operations with TanStack Query
// Login, register, logout, getCurrentUser
// ============================================================

"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ROUTES, API_ENDPOINTS } from "@/constants";
import api, { setAccessToken } from "@/lib/api";
import { authKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";
import type { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";

const MOCK_USER: User = {
  id: "mock-001",
  email: "admin@smile.med",
  firstName: "Admin",
  lastName: "User",
  phone: "+1 (555) 000-0000",
  role: "SUPER_ADMIN",
  isActive: true,
  isEmailVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, logout: clearAuth } = useAuthStore();

  // ─── Fetch current user ──────────────────────────────────
  const {
    data: currentUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<User> => {
      return MOCK_USER;
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    enabled: !isMockMode(),
  });

  // Mock mode: auto-set the mock user on mount
  useEffect(() => {
    if (isMockMode()) {
      setUser(MOCK_USER);
    }
  }, [setUser]);

  // Sync query result to Zustand store
  if (currentUser && !isLoading) {
    setUser(currentUser);
  }

  // ─── Login mutation ──────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthTokens> => {
      if (isMockMode()) {
        return { accessToken: "mock-token", refreshToken: "mock-refresh", expiresIn: 3600 };
      }
      const { data } = await api.post<AuthTokens>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
      );
      return data;
    },
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      router.push(ROUTES.DASHBOARD);
    },
  });

  // ─── Register mutation ───────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest): Promise<AuthTokens> => {
      if (isMockMode()) {
        return { accessToken: "mock-token", refreshToken: "mock-refresh", expiresIn: 3600 };
      }
      const { data: tokens } = await api.post<AuthTokens>(
        API_ENDPOINTS.AUTH.REGISTER,
        data,
      );
      return tokens;
    },
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      router.push(ROUTES.DASHBOARD);
    },
  });

  // ─── Logout ──────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!isMockMode()) {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      }
    },
    onSettled: () => {
      setAccessToken(null);
      clearAuth();
      queryClient.clear();
      router.push(ROUTES.LOGIN);
    },
  });

  return {
    user: currentUser ?? (isMockMode() ? MOCK_USER : null),
    isLoading,
    isError,
    login: loginMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegisterPending: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLogoutPending: logoutMutation.isPending,
  };
}
