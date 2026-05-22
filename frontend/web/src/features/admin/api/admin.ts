import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  UserManagement,
  LockUserRequest,
  UpdateUserRolesRequest,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  Permission,
  UserListParams,
  UserProfile,
  UserProfileListParams,
  BanUserRequest,
} from '../types/admin.type';

// Response shape from /v1/user-profiles
interface UserProfilesResponse {
  data: UserProfile[];
  meta: { page: number; limit: number; total: number };
}

export const adminApi = {
  // User Profiles (new /v1/user-profiles API)
  getUserProfiles: async (params?: UserProfileListParams): Promise<UserProfilesResponse> => {
    const { data } = await apiClient.get<UserProfilesResponse>(
      API_ENDPOINTS.ADMIN.USER_PROFILES.LIST,
      { params }
    );
    return data;
  },

  banUser: async (id: string, request: BanUserRequest): Promise<UserProfile> => {
    const { data } = await apiClient.post<UserProfile>(
      API_ENDPOINTS.ADMIN.USER_PROFILES.BAN(id),
      request
    );
    return data;
  },

  unbanUser: async (id: string): Promise<UserProfile> => {
    const { data } = await apiClient.post<UserProfile>(
      API_ENDPOINTS.ADMIN.USER_PROFILES.UNBAN(id)
    );
    return data;
  },

  // User Management (legacy)
  getUsers: async (params?: UserListParams): Promise<BaseResponse<PaginatedResponse<UserManagement>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<UserManagement>>>(
      API_ENDPOINTS.ADMIN.USERS.LIST,
      { params }
    );
    return data;
  },

  lockUser: async (userId: string, request: LockUserRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.USERS.LOCK(userId),
      request
    );
    return data;
  },

  unlockUser: async (userId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.USERS.UNLOCK(userId)
    );
    return data;
  },

  updateUserRoles: async (userId: string, request: UpdateUserRolesRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.USERS.UPDATE_ROLES(userId),
      request
    );
    return data;
  },

  // Role Management
  getRoles: async (): Promise<BaseResponse<Role[]>> => {
    const { data } = await apiClient.get<BaseResponse<Role[]>>(
      API_ENDPOINTS.ADMIN.ROLES.LIST
    );
    return data;
  },

  getRoleById: async (roleId: string): Promise<BaseResponse<Role>> => {
    const { data } = await apiClient.get<BaseResponse<Role>>(
      API_ENDPOINTS.ADMIN.ROLES.DETAIL(roleId)
    );
    return data;
  },

  getRoleByName: async (roleName: string): Promise<BaseResponse<Role>> => {
    const { data } = await apiClient.get<BaseResponse<Role>>(
      API_ENDPOINTS.ADMIN.ROLES.BY_NAME(roleName)
    );
    return data;
  },

  createRole: async (request: CreateRoleRequest): Promise<BaseResponse<Role>> => {
    const { data } = await apiClient.post<BaseResponse<Role>>(
      API_ENDPOINTS.ADMIN.ROLES.CREATE,
      request
    );
    return data;
  },

  updateRole: async (roleId: string, request: UpdateRoleRequest): Promise<BaseResponse<Role>> => {
    const { data } = await apiClient.put<BaseResponse<Role>>(
      API_ENDPOINTS.ADMIN.ROLES.UPDATE(roleId),
      request
    );
    return data;
  },

  deleteRole: async (roleId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.ROLES.DELETE(roleId)
    );
    return data;
  },

  getRolePermissions: async (roleId: string): Promise<BaseResponse<Permission[]>> => {
    const { data } = await apiClient.get<BaseResponse<Permission[]>>(
      API_ENDPOINTS.ADMIN.ROLES.PERMISSIONS(roleId)
    );
    return data;
  },

  updateRolePermissions: async (
    roleId: string, 
    request: UpdateRolePermissionsRequest
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.ROLES.UPDATE_PERMISSIONS(roleId),
      request
    );
    return data;
  },

  addPermissionToRole: async (roleId: string, permissionId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.ROLES.ADD_PERMISSION(roleId, permissionId)
    );
    return data;
  },

  removePermissionFromRole: async (roleId: string, permissionId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.ADMIN.ROLES.REMOVE_PERMISSION(roleId, permissionId)
    );
    return data;
  },

  // Permission Management
  getPermissions: async (): Promise<BaseResponse<Permission[]>> => {
    const { data } = await apiClient.get<BaseResponse<Permission[]>>(
      API_ENDPOINTS.ADMIN.PERMISSIONS.LIST
    );
    return data;
  },

  getPermissionById: async (permissionId: string): Promise<BaseResponse<Permission>> => {
    const { data } = await apiClient.get<BaseResponse<Permission>>(
      API_ENDPOINTS.ADMIN.PERMISSIONS.DETAIL(permissionId)
    );
    return data;
  },
};