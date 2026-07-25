import type { GENDER_TYPE } from '@/shared/constants/common';

// User Management Types
export interface UserManagement {
  userId: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  gender: GENDER_TYPE | null;
  avatarUrl: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  permissions: string[];
}

// User Profile
export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: GENDER_TYPE | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
}

export interface UserProfileListParams {
  page?: number;
  limit?: number;
  email?: string;
  phone?: string;
  full_name?: string;
  gender?: GENDER_TYPE;
}

export interface BanUserRequest {
  reason?: string;
}

export interface LockUserRequest {
  reason: string;
}

export interface UpdateUserRolesRequest {
  roleNames: string[];
}

// Role Management Types
export interface Role {
  roleId: string;
  roleName: string;
  description: string;
  createdAt: string;
  permissions: string[];
}

// Raw backend snake_case role
export interface RoleApi {
  role_id: string;
  role_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface RolesApiResponse {
  data: RoleApi[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRoleApiRequest {
  role_name: string;
  description?: string;
}

export interface CreateRoleRequest {
  roleName: string;
  description: string;
}

export interface UpdateRoleRequest {
  roleName?: string;
  description?: string;
}

export interface UpdateRolePermissionsRequest {
  permissionNames: string[];
}

// Permission Types
export interface Permission {
  permissionId: string;
  permissionName: string;
  resource: string;
  action: string;
  description: string;
  createdAt: string;
}

// Raw backend snake_case permission
export interface PermissionApi {
  permission_id: string;
  permission_name: string;
  resource: string | null;
  action: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CreatePermissionApiRequest {
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionApiRequest {
  permission_name?: string;
  resource?: string;
  action?: string;
  description?: string | null;
}

// Audit Log Types
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'REGISTER' | string;

export interface AuditLog {
  log_id: string;
  user_id: string | null;
  action: AuditAction;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  full_name?: string | null;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  action?: string;
  resource?: string;
  from_date?: string;
  to_date?: string;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: { page: number; limit: number; total: number };
}

export type AdminKycStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface AdminKycRecord {
  kycId?: string;
  status: AdminKycStatus;
  idType?: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  idNumberMasked?: string;
  ocrStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  ocrConfidence?: number | null;
  ocrPayload?: Record<string, unknown> | null;
  ocrLastError?: string | null;
  statusMessage?: string;
  decisionSource?: 'AUTO' | 'MANUAL' | null;
  decisionReason?: string | null;
  ocrProcessedAt?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  notes?: string | null;
  consentVersion?: string | null;
  documentStorageConsentAcceptedAt?: string | null;
  ocrProcessingConsentAcceptedAt?: string | null;
  noMarketingConsentAcceptedAt?: string | null;
  processingPurpose?: string | null;
  retentionPolicyVersion?: string | null;
  retentionExpiresAt?: string | null;
  deletedAt?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
}

export interface AdminKycListParams {
  status?: AdminKycStatus;
  ocrStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  decisionSource?: 'AUTO' | 'MANUAL';
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminKycListResponse {
  data: AdminKycRecord[];
  meta: { page: number; limit: number; total: number };
}

export interface RejectKycRequest {
  rejectionReason: string;
  adminNotes?: string;
}

// Pagination for User List
export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

// Refund approval workflow (K4)
export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REFUNDING'
  | 'REFUNDED'
  | 'REJECTED';

export interface AdminPayment {
  payment_id: string;
  appointment_id: string;
  amount: string | number;
  currency: string;
  status: string;
  provider: string;
  provider_txn_ref: string | null;
  order_info: string | null;
  refund_amount: string | number | null;
  refunded_at: string | null;
  refund_status: RefundStatus | null;
  refund_reason: string | null;
  refund_requested_by: string | null;
  refund_requested_at: string | null;
  refund_reviewed_by: string | null;
  refund_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundQueueParams {
  status?: RefundStatus;
}

export interface ApproveRefundRequest {
  amount?: number;
}

export interface RejectRefundRequest {
  reason: string;
}
