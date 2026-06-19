import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse } from '@/shared/types/response.type';

import { 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest,
  SendOtpRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  Role,
  RequestOtpData
} from '../types/auth.type';

// IAM service actual login response shape
interface IamLoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: Record<string, unknown>;
}

export const authApi = {
  // Authentication
  login: async (request: LoginRequest): Promise<BaseResponse<AuthResponse>> => {
    const { data } = await apiClient.post<IamLoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email: request.emailOrPhone, password: request.password }
    );
    // Map IAM response to the frontend's BaseResponse<AuthResponse> shape
    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: data.token,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
        expiresIn: data.tokenExpires,
        user: data.user as unknown as User,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + data.tokenExpires).toISOString(),
      },
    };
  },

  register: async (request: RegisterRequest): Promise<BaseResponse<{ message: string }>> => {
    const { data } = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.REGISTER,
      request
    );
    return { success: true, message: data.message, data };
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  refreshToken: async (refreshToken: string): Promise<BaseResponse<AuthResponse>> => {
    const { data } = await apiClient.post<BaseResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return data;
  },

  // Password Management
  forgotPassword: async (request: ForgotPasswordRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      request
    );
    return data;
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      request
    );
    return data;
  },

  changePassword: async (request: ChangePasswordRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      request
    );
    return data;
  },

  // OTP
  sendOtp: async (request: SendOtpRequest): Promise<BaseResponse<RequestOtpData>> => {
    const { data } = await apiClient.post<BaseResponse<RequestOtpData>>(
      API_ENDPOINTS.AUTH.SEND_OTP,
      request
    );
    return data;
  },

  verifyOtp: async (request: VerifyOtpRequest): Promise<BaseResponse<AuthResponse>> => {
    const { data } = await apiClient.post<BaseResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      request
    );
    return data;
  },

  verifyEmail: async (request: VerifyOtpRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      request
    );
    return data;
  },

  verifyPhone: async (request: VerifyOtpRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.AUTH.VERIFY_PHONE,
      request
    );
    return data;
  },

  // User Profile
  getMe: async (): Promise<BaseResponse<User>> => {
    const { data } = await apiClient.get<BaseResponse<User>>(
      API_ENDPOINTS.USER.ME
    );
    return data;
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<BaseResponse<User>> => {
    const { data } = await apiClient.patch<BaseResponse<User>>(
      API_ENDPOINTS.USER.UPDATE_PROFILE,
      {
        ...(request.fullName !== undefined && { fullName: request.fullName }),
        ...(request.gender !== undefined && { gender: request.gender }),
        ...(request.password !== undefined && { password: request.password }),
      }
    );
    return data;
  },

  // Roles
  getRoles: async (): Promise<BaseResponse<Role[]>> => {
    const { data } = await apiClient.get<BaseResponse<Role[]>>(
      API_ENDPOINTS.ROLE.LIST
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
      message: 'Google login successful',
      data: {
        accessToken: data.token,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
        expiresIn: data.tokenExpires,
        user: data.user as unknown as User,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + data.tokenExpires).toISOString(),
      },
    };
  },
};