import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/features/auth/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";

import { useAuth } from "./useAuth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/shared/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    apiError: vi.fn(),
  },
}));

vi.mock("@/features/auth/api/auth", () => ({
  authApi: {
    verifyPhone: vi.fn(),
    getMe: vi.fn(),
    getMyKyc: vi.fn(),
    getMyKycHistory: vi.fn(),
  },
}));

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("useAuth phone verification", () => {
  beforeEach(() => {
    vi.mocked(authApi.verifyPhone).mockReset();
    vi.mocked(authApi.getMe).mockReset();
    vi.mocked(authApi.getMyKyc).mockReset();
    vi.mocked(authApi.getMyKycHistory).mockReset();
    vi.mocked(authApi.getMe).mockResolvedValue({
      success: true,
      message: "Profile loaded",
      data: null as never,
    });
    vi.mocked(authApi.getMyKyc).mockResolvedValue({
      success: true,
      message: "KYC loaded",
      data: null as never,
    });
    vi.mocked(authApi.getMyKycHistory).mockResolvedValue({
      success: true,
      message: "KYC history loaded",
      data: [],
    });
    useAuthStore.setState({
      user: {
        userId: "patient-a",
        username: "patient-a",
        email: "patient-a@example.test",
        phone: "0900000000",
        fullName: "Patient A",
        dateOfBirth: "1995-06-15",
        gender: "OTHER",
        avatarUrl: "",
        status: "ACTIVE",
        emailVerified: true,
        phoneVerified: false,
        lastLoginAt: null,
        createdAt: "",
        updatedAt: "",
        roles: ["PATIENT"],
        permissions: [],
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("marks the persisted user as phone verified after OTP verification succeeds", async () => {
    vi.mocked(authApi.verifyPhone).mockResolvedValue({
      success: true,
      message: "Phone number verified successfully",
      data: undefined,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.verifyPhone({
        emailOrPhone: "0900000000",
        otpCode: "123456",
        otpType: "PHONE_VERIFY",
      });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().user?.phoneVerified).toBe(true);
    });
  });
});
