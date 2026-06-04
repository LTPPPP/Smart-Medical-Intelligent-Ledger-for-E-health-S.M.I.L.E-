import { GENDER_TYPE } from "@/shared/constants";


// User & Auth
export interface User {
  userId: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  gender: GENDER_TYPE;
  avatarUrl: string;
  address?: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  issuedAt: string;
  expiresAt: string;
}

export interface RequestOtpData {
  testOtp?: string;
  expiredIn: number;
}

// Auth Requests
export interface LoginRequest {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone?: string;
  password: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  emailOrPhone: string;
}

export interface ResetPasswordRequest {
  emailOrPhone: string;
  otp: string;
  newPassword: string;
}

export interface SendOtpRequest {
  emailOrPhone: string;
  otpType: 'LOGIN' | 'PASSWORD_RESET' | 'EMAIL_VERIFY' | 'PHONE_VERIFY';
}

export interface VerifyOtpRequest {
  emailOrPhone: string;
  otpCode: string;
  otpType: 'LOGIN' | 'PASSWORD_RESET' | 'EMAIL_VERIFY' | 'PHONE_VERIFY';
}

// User Profile
export interface UpdateProfileRequest {
  fullName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  avatarUrl?: string;
  password?: string;
}

// Role
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

// OAuth
export interface OAuthProvider {
  provider: 'GOOGLE' | 'FACEBOOK';
  redirectUrl: string;
}

// KYC
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface KycData {
  kycId?: string;
  status: KycStatus;
  idType?: 'CITIZEN_ID' | 'PASSPORT' | 'DRIVER_LICENSE';
  fullName?: string | null;
  dateOfBirth?: string | null;
  idNumberMasked?: string;
  ocrStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  ocrConfidence?: number | null;
  ocrLastError?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
}

export interface SubmitKycRequest {
  idType: 'CITIZEN_ID' | 'PASSPORT' | 'DRIVER_LICENSE';
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  idFront: File;
  idBack: File;
  selfie: File;
  consentAccepted: boolean;
  documentStorageConsentAccepted: boolean;
  ocrProcessingConsentAccepted: boolean;
  noMarketingConsentAccepted: boolean;
  consentVersion?: string;
  retentionPolicyVersion?: string;
  notes?: string;
}

export interface SendPhoneOtpResponse {
  message: string;
  devOtp?: string;
}

// Access Log
export interface AccessLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
