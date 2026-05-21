'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';

import { 
  LoginRequest, 
  RegisterRequest, 
  VerifyOtpRequest, 
  SendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest
} from '@/features/auth/types/auth.type';
import { authApi } from '@/features/auth/api/auth';
import { useAuthStore } from '@/features/auth/store/authStore';

import { ROUTES } from '@/shared/constants/routes';

export const AUTH_QUERY_KEY = 'auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth, logout: clearStore, accessToken } = useAuthStore();

  // Login
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (response) => {
      if (response.success) {
        setAuth(response.data);
        queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
        router.push(ROUTES.DASHBOARD);
      }
    },
  });

  // Register
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: () => {
      router.push(ROUTES.LOGIN);
    },
  });

  // OTP
  const sendOtpMutation = useMutation({
    mutationFn: (payload: SendOtpRequest) => authApi.sendOtp(payload),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload),
    onSuccess: (response) => {
      if (response.success) {
        setAuth(response.data);
        queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
        router.push(ROUTES.DASHBOARD);
      }
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'me'] });
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyPhone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'me'] });
    },
  });

  // Password
  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authApi.resetPassword(payload),
    onSuccess: () => {
      router.push(ROUTES.LOGIN);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
  });

  // Profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [AUTH_QUERY_KEY, 'me'],
    queryFn: () => authApi.getMe(),
    enabled: !!accessToken,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => authApi.updateProfile(payload),
    onSuccess: (response) => {
      // The backend returns the raw Account object (accountId, fullName, gender, …)
      // Merge updated fields back into the persisted Zustand store so the UI stays in sync
      const updated = response as unknown as Record<string, unknown>;
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            ...(updated.fullName !== undefined && { fullName: updated.fullName as string }),
            ...(updated.gender !== undefined && { gender: updated.gender as typeof currentUser.gender }),
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'me'] });
    },
  });

  // Roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: [AUTH_QUERY_KEY, 'roles'],
    queryFn: () => authApi.getRoles(),
    enabled: !!accessToken,
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const rt = useAuthStore.getState().refreshToken;
      if (rt) await authApi.logout(rt);
    },
    onSuccess: () => {
      clearStore();
      queryClient.clear();
      router.push(ROUTES.LOGIN);
    },
  });

  return {
    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    sendOtp: sendOtpMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    verifyPhone: verifyPhoneMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Data
    userProfile: userProfile?.data,
    roles: rolesData?.data,

    // Loading States
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isSendingOtp: sendOtpMutation.isPending,
    isVerifying: verifyOtpMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isVerifyingPhone: verifyPhoneMutation.isPending,
    isForgotPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoadingProfile,
    isLoadingRoles,
    
    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    sendOtpError: sendOtpMutation.error,
    verifyOtpError: verifyOtpMutation.error,
  };
}