import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { BaseResponse } from "@/shared/types/response.type";

import {
	AuthResponse,
	RegisterRequest,
	LoginRequest,
	SendOtpRequest,
	VerifyOtpRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ResetPasswordByHashRequest,
	ChangePasswordRequest,
	UpdateProfileRequest,
	User,
	Role,
	RequestOtpData,
	KycData,
	SubmitKycRequest,
	SendPhoneOtpResponse,
} from "../types/auth.type";

// IAM service actual login response shape
interface IamLoginResponse {
	token: string;
	refreshToken: string;
	tokenExpires: number;
	user: Record<string, unknown> & {
		accountId?: string;
		role?: string;
		roles?: string[];
		permissions?: string[];
	};
	// `users` table record (account.fullName may be null if not supplied at registration;
	// userProfile.full_name always has a fallback — see iam-service auth.service.ts#register).
	userProfile?: {
		full_name?: string;
		avatar_url?: string | null;
		date_of_birth?: string | null;
	} | null;
}

function mapIamUser(data: IamLoginResponse): User {
	return {
		...data.user,
		userId: data.user.userId ?? data.user.accountId,
		roles: data.user.roles ?? (data.user.role ? [data.user.role] : []),
		permissions: data.user.permissions ?? [],
		fullName: data.userProfile?.full_name ?? data.user.fullName,
		avatarUrl: data.userProfile?.avatar_url ?? undefined,
		dateOfBirth: data.userProfile?.date_of_birth ?? undefined,
	} as unknown as User;
}

export const authApi = {
	// Authentication
	login: async (request: LoginRequest): Promise<BaseResponse<AuthResponse>> => {
		const { data } = await apiClient.post<IamLoginResponse>(
			API_ENDPOINTS.AUTH.LOGIN,
			{ email: request.emailOrPhone, password: request.password },
		);
		// Map IAM response to the frontend's BaseResponse<AuthResponse> shape
		return {
			success: true,
			message: "Login successful",
			data: {
				accessToken: data.token,
				refreshToken: data.refreshToken,
				tokenType: "Bearer",
				expiresIn: data.tokenExpires,
				user: mapIamUser(data),
				issuedAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + data.tokenExpires).toISOString(),
			},
		};
	},

	register: async (
		request: RegisterRequest,
	): Promise<BaseResponse<{ message: string }>> => {
		const { data } = await apiClient.post<{ message: string }>(
			API_ENDPOINTS.AUTH.REGISTER,
			request,
		);
		return { success: true, message: data.message, data };
	},

	logout: async (): Promise<void> => {
		await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
	},

	refreshToken: async (
		refreshToken: string,
	): Promise<BaseResponse<AuthResponse>> => {
		const { data } = await apiClient.post<BaseResponse<AuthResponse>>(
			API_ENDPOINTS.AUTH.REFRESH,
			{ refreshToken },
		);
		return data;
	},

	// Password Management
	// IAM expects { email }; the FE form collects an emailOrPhone field.
	forgotPassword: async (
		request: ForgotPasswordRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.post<{ message: string }>(
			API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
			{ email: request.emailOrPhone },
		);
		return {
			success: true,
			message: data?.message ?? "Email sent",
			data: undefined,
		};
	},

	resetPassword: async (
		request: ResetPasswordRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.post<BaseResponse<void>>(
			API_ENDPOINTS.AUTH.RESET_PASSWORD,
			request,
		);
		return data;
	},

	// Hash-based reset matching IAM: POST /auth/reset/password { hash, password }
	resetPasswordByHash: async (
		request: ResetPasswordByHashRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.post<{ message: string }>(
			API_ENDPOINTS.AUTH.RESET_PASSWORD,
			{ hash: request.hash, password: request.password },
		);
		return {
			success: true,
			message: data?.message ?? "Password reset",
			data: undefined,
		};
	},

	changePassword: async (
		request: ChangePasswordRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.put<BaseResponse<void>>(
			API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
			request,
		);
		return data;
	},

	// OTP
	sendOtp: async (
		request: SendOtpRequest,
	): Promise<BaseResponse<RequestOtpData>> => {
		const { data } = await apiClient.post<BaseResponse<RequestOtpData>>(
			API_ENDPOINTS.AUTH.SEND_OTP,
			request,
		);
		return data;
	},

	verifyOtp: async (
		request: VerifyOtpRequest,
	): Promise<BaseResponse<AuthResponse>> => {
		const { data } = await apiClient.post<BaseResponse<AuthResponse>>(
			API_ENDPOINTS.AUTH.VERIFY_OTP,
			request,
		);
		return data;
	},

	verifyEmail: async (
		request: VerifyOtpRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.post<BaseResponse<void>>(
			API_ENDPOINTS.AUTH.VERIFY_EMAIL,
			request,
		);
		return data;
	},

	verifyPhone: async (
		request: VerifyOtpRequest,
	): Promise<BaseResponse<void>> => {
		const { data } = await apiClient.post<{ message: string }>(
			API_ENDPOINTS.AUTH.VERIFY_PHONE,
			{ otp: request.otpCode },
		);
		return { success: true, message: data.message, data: undefined };
	},

	sendPhoneOtp: async (): Promise<BaseResponse<SendPhoneOtpResponse>> => {
		const { data } = await apiClient.post<SendPhoneOtpResponse>(
			API_ENDPOINTS.AUTH.SEND_PHONE_OTP,
		);
		return { success: true, message: data.message, data };
	},

	getMyKyc: async (): Promise<BaseResponse<KycData>> => {
		const { data } = await apiClient.get<KycData>(API_ENDPOINTS.KYC.ME);
		return { success: true, message: "KYC status loaded", data };
	},

	getMyKycHistory: async (): Promise<BaseResponse<KycData[]>> => {
		const { data } = await apiClient.get<KycData[]>(API_ENDPOINTS.KYC.HISTORY);
		return { success: true, message: "KYC history loaded", data };
	},

	submitKyc: async (
		request: SubmitKycRequest,
	): Promise<BaseResponse<KycData>> => {
		const formData = new FormData();
		formData.append("idType", request.idType);
		formData.append("idNumber", request.idNumber);
		formData.append("fullName", request.fullName);
		formData.append("dateOfBirth", request.dateOfBirth);
		formData.append("consentAccepted", String(request.consentAccepted));
		formData.append(
			"documentStorageConsentAccepted",
			String(request.documentStorageConsentAccepted),
		);
		formData.append(
			"ocrProcessingConsentAccepted",
			String(request.ocrProcessingConsentAccepted),
		);
		formData.append(
			"noMarketingConsentAccepted",
			String(request.noMarketingConsentAccepted),
		);
		formData.append(
			"consentVersion",
			request.consentVersion ?? "kyc-consent-v2",
		);
		formData.append(
			"retentionPolicyVersion",
			request.retentionPolicyVersion ?? "kyc-retention-v1",
		);
		if (request.notes) formData.append("notes", request.notes);
		formData.append("idFront", request.idFront);
		formData.append("idBack", request.idBack);

		const { data } = await apiClient.post<KycData>(
			API_ENDPOINTS.KYC.SUBMIT,
			formData,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return { success: true, message: "KYC submitted", data };
	},

	// User Profile
	getMe: async (): Promise<BaseResponse<User>> => {
		const { data } = await apiClient.get<BaseResponse<User>>(
			API_ENDPOINTS.USER.ME,
		);
		return data;
	},

	updateProfile: async (
		request: UpdateProfileRequest,
	): Promise<BaseResponse<User>> => {
		const { data } = await apiClient.patch<BaseResponse<User>>(
			API_ENDPOINTS.USER.UPDATE_PROFILE,
			{
				...(request.fullName !== undefined && { fullName: request.fullName }),
				...(request.dateOfBirth !== undefined && {
					dateOfBirth: request.dateOfBirth,
				}),
				...(request.gender !== undefined && { gender: request.gender }),
				...(request.password !== undefined && { password: request.password }),
			},
		);
		return data;
	},

	// Roles
	getRoles: async (): Promise<BaseResponse<Role[]>> => {
		const { data } = await apiClient.get<BaseResponse<Role[]>>(
			API_ENDPOINTS.ROLE.LIST,
		);
		return data;
	},

	// OAuth — token exchange (client sends Google credential/access_token; backend validates)
	googleLogin: async (token: string): Promise<BaseResponse<AuthResponse>> => {
		const { data } = await apiClient.post<IamLoginResponse>(
			API_ENDPOINTS.OAUTH.GOOGLE,
			{ token },
		);
		return {
			success: true,
			message: "Google login successful",
			data: {
				accessToken: data.token,
				refreshToken: data.refreshToken,
				tokenType: "Bearer",
				expiresIn: data.tokenExpires,
				user: mapIamUser(data),
				issuedAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + data.tokenExpires).toISOString(),
			},
		};
	},
};
