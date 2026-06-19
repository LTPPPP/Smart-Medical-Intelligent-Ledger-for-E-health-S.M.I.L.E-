'use client';

import { useRouter } from 'next/navigation';

import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api/auth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { 
  LoginRequest, 
  RegisterRequest, 
  VerifyOtpRequest, 
  SendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  SubmitKycRequest
} from '@/features/auth/types/auth.type';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

export const AUTH_QUERY_KEY = 'auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth, logout: clearStore, accessToken } = useAuthStore();

  // Google Login
  const googleLoginMutation = useMutation({
    mutationFn: (accessToken: string) => authApi.googleLogin(accessToken),
    onSuccess: (response) => {
      if (response.success) {
        setAuth(response.data);
        queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
        toast.success('Đăng nhập Google thành công!');
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (error) => {
      toast.apiError(error, 'Đăng nhập Google thất bại');
    },
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (response) => {
      if (response.success) {
        setAuth(response.data);
        queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
        toast.success('Đăng nhập thành công! Chào mừng bạn trở lại.');
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (error) => {
      toast.apiError(error, 'Đăng nhập thất bại');
    },
  });

  // Register
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.apiError(error, 'Đăng ký thất bại');
    },
  });

  // OTP
  const sendOtpMutation = useMutation({
    mutationFn: (payload: SendOtpRequest) => authApi.sendOtp(payload),
    onSuccess: () => {
      toast.success('Mã OTP đã được gửi. Vui lòng kiểm tra.');
    },
    onError: (error) => {
      toast.apiError(error, 'Gửi OTP thất bại');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload),
    onSuccess: (response) => {
      if (response.success) {
        setAuth(response.data);
        queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
        toast.success('Xác thực thành công!');
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (error) => {
      toast.apiError(error, 'Xác thực OTP thất bại');
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyEmail(payload),
    onSuccess: () => {
      toast.success('Xác thực email thành công!');
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'me'] });
    },
    onError: (error) => {
      toast.apiError(error, 'Xác thực email thất bại');
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyPhone(payload),
    onSuccess: () => {
      toast.success('Xác thực số điện thoại thành công!');
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'me'] });
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'kyc'] });
    },
    onError: (error) => {
      toast.apiError(error, 'Xác thực số điện thoại thất bại');
    },
  });

  const sendPhoneOtpMutation = useMutation({
    mutationFn: () => authApi.sendPhoneOtp(),
  });

  // Password
  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload),
    onSuccess: () => {
      toast.success('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.');
    },
    onError: (error) => {
      toast.apiError(error, 'Gửi yêu cầu thất bại');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authApi.resetPassword(payload),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      router.push(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.apiError(error, 'Đặt lại mật khẩu thất bại');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Đổi mật khẩu thất bại');
    },
  });

  // Profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [AUTH_QUERY_KEY, 'me'],
    queryFn: () => authApi.getMe(),
    enabled: !!accessToken,
  });

  const { data: kycData, isLoading: isLoadingKyc } = useQuery({
    queryKey: [AUTH_QUERY_KEY, 'kyc'],
    queryFn: () => authApi.getMyKyc(),
    enabled: !!accessToken,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.ocrStatus;
      return status === 'PENDING' || status === 'PROCESSING' ? 3000 : false;
    },
  });

  const { data: kycHistoryData, isLoading: isLoadingKycHistory } = useQuery({
    queryKey: [AUTH_QUERY_KEY, 'kyc-history'],
    queryFn: () => authApi.getMyKycHistory(),
    enabled: !!accessToken,
  });

  const submitKycMutation = useMutation({
    mutationFn: (payload: SubmitKycRequest) => authApi.submitKyc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'kyc'] });
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, 'kyc-history'] });
    },
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
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật hồ sơ thất bại');
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
      authApi.logout().catch(() => {});
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
    googleLogin: googleLoginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    sendOtp: sendOtpMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    verifyPhone: verifyPhoneMutation.mutateAsync,
    sendPhoneOtp: sendPhoneOtpMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    submitKyc: submitKycMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Data
    userProfile: userProfile?.data,
    kyc: kycData?.data,
    kycHistory: kycHistoryData?.data ?? [],
    roles: rolesData?.data,

    // Loading States
    isGoogleLoggingIn: googleLoginMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isSendingOtp: sendOtpMutation.isPending,
    isVerifying: verifyOtpMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isVerifyingPhone: verifyPhoneMutation.isPending,
    isSendingPhoneOtp: sendPhoneOtpMutation.isPending,
    isSubmittingKyc: submitKycMutation.isPending,
    isForgotPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoadingProfile,
    isLoadingKyc,
    isLoadingKycHistory,
    isLoadingRoles,
    
    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    sendOtpError: sendOtpMutation.error,
    verifyOtpError: verifyOtpMutation.error,
  };
}
