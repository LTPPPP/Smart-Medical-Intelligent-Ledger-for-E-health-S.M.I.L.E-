"use client";

import { useRouter } from "next/navigation";

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import { authApi } from "@/features/auth/api/auth";
import {
	selectHasSession,
	useAuthStore,
} from "@/features/auth/store/authStore";
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
	AvatarSignatureParams,
} from "@/features/auth/types/auth.type";
import { requiresStaffKyc } from "@/shared/constants/nav";
import { ROUTES } from "@/shared/constants/routes";
import { logApiError, toast } from "@/shared/lib/toast";
import { getSafeCallbackUrl } from "@/shared/lib/utils";

export const AUTH_QUERY_KEY = "auth";

export function useAuth() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { setAuth, logout: clearStore, user } = useAuthStore();
	const hasSession = useAuthStore(selectHasSession);
	const shouldLoadKyc = requiresStaffKyc(user?.roles);
	const shouldLoadRoles = (user?.roles ?? []).some(
		(role) =>
			role
				.replace(/^ROLE_/i, "")
				.trim()
				.toUpperCase() === "ADMIN",
	);

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
		mutationFn: (variables: LoginRequest & { callbackUrl?: string }) => {
			const payload = { ...variables };
			delete payload.callbackUrl;
			return authApi.login(payload);
		},
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
			logApiError(error, "Sign in");
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
			logApiError(error, "Registration");
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
			logApiError(error, "Request password reset");
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
			logApiError(error, "Reset password");
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
			logApiError(error, "Reset password from link");
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
		enabled: hasSession,
	});

	const { data: kycData, isLoading: isLoadingKyc } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "kyc"],
		queryFn: () => authApi.getMyKyc(),
		enabled: hasSession && shouldLoadKyc,
		refetchInterval: (query) => {
			const status = query.state.data?.data?.ocrStatus;
			return status === "PENDING" || status === "PROCESSING" ? 3000 : false;
		},
	});

	const { data: kycHistoryData, isLoading: isLoadingKycHistory } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "kyc-history"],
		queryFn: () => authApi.getMyKycHistory(),
		enabled: hasSession && shouldLoadKyc,
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
			// Syncs the updated fields into the store.
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

	// Signs the widget's upload.
	const avatarSignatureMutation = useMutation({
		mutationFn: (params: AvatarSignatureParams) =>
			authApi.getAvatarSignature(params),
	});

	// Persists the uploaded URL.
	const confirmAvatarMutation = useMutation({
		mutationFn: (avatarUrl: string) => authApi.confirmAvatar(avatarUrl),
		onSuccess: (response) => {
			const updated = response as unknown as Record<string, unknown>;
			const currentUser = useAuthStore.getState().user;
			if (currentUser && updated.avatarUrl !== undefined) {
				useAuthStore.setState({
					user: { ...currentUser, avatarUrl: updated.avatarUrl as string },
				});
			}
			queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY, "me"] });
			toast.success("Avatar updated!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to update avatar");
		},
	});

	// Roles
	const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
		queryKey: [AUTH_QUERY_KEY, "roles"],
		queryFn: () => authApi.getRoles(),
		enabled: hasSession && shouldLoadRoles,
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
		getAvatarSignature: avatarSignatureMutation.mutateAsync,
		confirmAvatar: confirmAvatarMutation.mutateAsync,
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
		isConfirmingAvatar: confirmAvatarMutation.isPending,
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
