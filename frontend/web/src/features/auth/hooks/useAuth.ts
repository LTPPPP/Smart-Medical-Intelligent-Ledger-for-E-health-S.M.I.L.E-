"use client";

import { useRouter } from "next/navigation";

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import { authApi } from "@/features/auth/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
	LoginRequest,
	RegisterRequest,
	VerifyOtpRequest,
	SendOtpRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ResetPasswordByHashRequest,
	ChangePasswordRequest,
	UpdateProfileRequest,
	SubmitKycRequest,
} from "@/features/auth/types/auth.type";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";
import { getSafeCallbackUrl } from "@/shared/lib/utils";

export const AUTH_QUERY_KEY = "auth";

export function useAuth() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { setAuth, logout: clearStore, accessToken } = useAuthStore();

	// Google Login
	const googleLoginMutation = useMutation({
		mutationFn: ({
			accessToken,
		}: { accessToken: string; callbackUrl?: string }) =>
			authApi.googleLogin(accessToken),
		onSuccess: (response, variables) => {
			if (response.success) {
				setAuth(response.data);
				queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
				toast.success("Signed in with Google!");
				router.push(
					getSafeCallbackUrl(variables.callbackUrl, ROUTES.DASHBOARD),
				);
			}
		},
		onError: (error) => {
			toast.apiError(error, "Google sign-in failed");
		},
	});

	// Login
	const loginMutation = useMutation({
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip callbackUrl before it reaches the API (backend rejects unknown fields)
		mutationFn: ({
			callbackUrl,
			...payload
		}: LoginRequest & { callbackUrl?: string }) => authApi.login(payload),
		onSuccess: (response, variables) => {
			if (response.success) {
				setAuth(response.data);
				queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
				toast.success("Signed in! Welcome back.");
				router.push(
					getSafeCallbackUrl(variables.callbackUrl, ROUTES.DASHBOARD),
				);
			}
		},
		onError: (error) => {
			toast.apiError(error, "Sign in failed");
		},
	});

	// Register
	const registerMutation = useMutation({
		mutationFn: (payload: RegisterRequest) => authApi.register(payload),
		onSuccess: () => {
			toast.success("Registration successful! Please sign in.");
			router.push(ROUTES.LOGIN);
		},
		onError: (error) => {
			toast.apiError(error, "Registration failed");
		},
	});

	// OTP
	const sendOtpMutation = useMutation({
		mutationFn: (payload: SendOtpRequest) => authApi.sendOtp(payload),
		onSuccess: () => {
			toast.success("OTP sent. Please check your messages.");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to send OTP");
		},
	});

	const verifyOtpMutation = useMutation({
		mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload),
		onSuccess: (response) => {
			if (response.success) {
				setAuth(response.data);
				queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
				toast.success("Verified!");
				router.push(ROUTES.DASHBOARD);
			}
		},
		onError: (error) => {
			toast.apiError(error, "OTP verification failed");
		},
	});

	const verifyEmailMutation = useMutation({
		mutationFn: (payload: VerifyOtpRequest) => authApi.verifyEmail(payload),
		onSuccess: () => {
			toast.success("Email verified!");
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "me"] });
		},
		onError: (error) => {
			toast.apiError(error, "Email verification failed");
		},
	});

	const verifyPhoneMutation = useMutation({
		mutationFn: (payload: VerifyOtpRequest) => authApi.verifyPhone(payload),
		onSuccess: () => {
			toast.success("Phone verified!");
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "me"] });
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "kyc"] });
		},
		onError: (error) => {
			toast.apiError(error, "Phone verification failed");
		},
	});

	const sendPhoneOtpMutation = useMutation({
		mutationFn: () => authApi.sendPhoneOtp(),
	});

	// Password
	const forgotPasswordMutation = useMutation({
		mutationFn: (payload: ForgotPasswordRequest) =>
			authApi.forgotPassword(payload),
		onSuccess: () => {
			toast.success("Password reset email sent. Please check your inbox.");
		},
		onError: (error) => {
			toast.apiError(error, "Request failed");
		},
	});

	const resetPasswordMutation = useMutation({
		mutationFn: (payload: ResetPasswordRequest) =>
			authApi.resetPassword(payload),
		onSuccess: () => {
			toast.success("Password reset! Please sign in again.");
			router.push(ROUTES.LOGIN);
		},
		onError: (error) => {
			toast.apiError(error, "Password reset failed");
		},
	});

	const resetPasswordByHashMutation = useMutation({
		mutationFn: (payload: ResetPasswordByHashRequest) =>
			authApi.resetPasswordByHash(payload),
		onSuccess: () => {
			toast.success("Password reset! Please sign in again.");
			router.push(ROUTES.LOGIN);
		},
		onError: (error) => {
			toast.apiError(error, "Password reset failed");
		},
	});

	const changePasswordMutation = useMutation({
		mutationFn: (payload: ChangePasswordRequest) =>
			authApi.changePassword(payload),
		onSuccess: () => {
			toast.success("Password changed!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to change password");
		},
	});

	// Profile
	const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "me"],
		queryFn: () => authApi.getMe(),
		enabled: !!accessToken,
	});

	const { data: kycData, isLoading: isLoadingKyc } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "kyc"],
		queryFn: () => authApi.getMyKyc(),
		enabled: !!accessToken,
		refetchInterval: (query) => {
			const status = query.state.data?.data?.ocrStatus;
			return status === "PENDING" || status === "PROCESSING" ? 3000 : false;
		},
	});

	const { data: kycHistoryData, isLoading: isLoadingKycHistory } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "kyc-history"],
		queryFn: () => authApi.getMyKycHistory(),
		enabled: !!accessToken,
	});

	const submitKycMutation = useMutation({
		mutationFn: (payload: SubmitKycRequest) => authApi.submitKyc(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "kyc"] });
			queryClient.invalidateQueries({
				queryKey: [AUTH_QUERY_KEY, "kyc-history"],
			});
		},
	});

	const updateProfileMutation = useMutation({
		mutationFn: (payload: UpdateProfileRequest) =>
			authApi.updateProfile(payload),
		onSuccess: (response) => {
			// The backend returns the raw Account object (accountId, fullName, gender, …)
			// Merge updated fields back into the persisted Zustand store so the UI stays in sync
			const updated = response as unknown as Record<string, unknown>;
			const currentUser = useAuthStore.getState().user;
			if (currentUser) {
				useAuthStore.setState({
					user: {
						...currentUser,
						...(updated.fullName !== undefined && {
							fullName: updated.fullName as string,
						}),
						...(updated.dateOfBirth !== undefined && {
							dateOfBirth: updated.dateOfBirth as string,
						}),
						...(updated.gender !== undefined && {
							gender: updated.gender as typeof currentUser.gender,
						}),
					},
				});
			}
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "me"] });
			toast.success("Profile updated!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to update profile");
		},
	});

	// Roles
	const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "roles"],
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
		resetPasswordByHash: resetPasswordByHashMutation.mutateAsync,
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
		isResettingPassword:
			resetPasswordMutation.isPending || resetPasswordByHashMutation.isPending,
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
