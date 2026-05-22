// User Management Types
export interface UserManagement {
  userId: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
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

// User Profile (from /v1/user-profiles)
export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
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
  gender?: string;
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

// Pagination for User List
export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string[];
}