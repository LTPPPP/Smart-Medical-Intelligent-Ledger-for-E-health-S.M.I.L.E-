'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type {
  LockUserRequest,
  UpdateUserRolesRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  UserListParams,
  UserProfileListParams,
  BanUserRequest,
} from '../types/admin.type';

export const ADMIN_QUERY_KEY = 'admin';

export function useAdmin() {
  const queryClient = useQueryClient();

  // ── User Profiles (new API)
  const useUserProfiles = (params?: UserProfileListParams) =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'user-profiles', params],
      queryFn: () => adminApi.getUserProfiles(params),
    });

  const banUserMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: BanUserRequest }) =>
      adminApi.banUser(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'user-profiles'] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'user-profiles'] });
    },
  });

  // ── User Management (legacy)
  const useUsers = (params?: UserListParams) => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'users', params],
      queryFn: () => adminApi.getUsers(params),
    });
  };

  // User Management Mutations
  const lockUserMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: LockUserRequest }) =>
      adminApi.lockUser(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'users'] });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'users'] });
    },
  });

  const updateUserRolesMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: UpdateUserRolesRequest }) =>
      adminApi.updateUserRoles(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'users'] });
    },
  });

  // Role Management Queries
  const useRoles = () => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles'],
      queryFn: () => adminApi.getRoles(),
    });
  };

  const useRoleById = (roleId: string | null) => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles', roleId],
      queryFn: () => adminApi.getRoleById(roleId!),
      enabled: !!roleId,
    });
  };

  const useRolePermissions = (roleId: string | null) => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles', roleId, 'permissions'],
      queryFn: () => adminApi.getRolePermissions(roleId!),
      enabled: !!roleId,
    });
  };

  // Role Management Mutations
  const createRoleMutation = useMutation({
    mutationFn: (request: CreateRoleRequest) => adminApi.createRole(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, request }: { roleId: string; request: UpdateRoleRequest }) =>
      adminApi.updateRole(roleId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles'] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => adminApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles'] });
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, request }: { roleId: string; request: UpdateRolePermissionsRequest }) =>
      adminApi.updateRolePermissions(roleId, request),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles', roleId] });
    },
  });

  // Permission Queries
  const usePermissions = () => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'permissions'],
      queryFn: () => adminApi.getPermissions(),
    });
  };

  return {
    // User Queries
    useUsers,

    // User Mutations
    lockUser: lockUserMutation.mutateAsync,
    unlockUser: unlockUserMutation.mutateAsync,
    updateUserRoles: updateUserRolesMutation.mutateAsync,

    // Role Queries
    useRoles,
    useRoleById,
    useRolePermissions,

    // Role Mutations
    createRole: createRoleMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    deleteRole: deleteRoleMutation.mutateAsync,
    updateRolePermissions: updateRolePermissionsMutation.mutateAsync,

    // Permission Queries
    usePermissions,

    // User Profiles (new API)
    useUserProfiles,
    banUser: banUserMutation.mutateAsync,
    unbanUser: unbanUserMutation.mutateAsync,
    isBanningUser: banUserMutation.isPending,
    isUnbanningUser: unbanUserMutation.isPending,

    // Loading States
    isLockingUser: lockUserMutation.isPending,
    isUnlockingUser: unlockUserMutation.isPending,
    isUpdatingUserRoles: updateUserRolesMutation.isPending,
    isCreatingRole: createRoleMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isDeletingRole: deleteRoleMutation.isPending,
    isUpdatingRolePermissions: updateRolePermissionsMutation.isPending,
  };
}