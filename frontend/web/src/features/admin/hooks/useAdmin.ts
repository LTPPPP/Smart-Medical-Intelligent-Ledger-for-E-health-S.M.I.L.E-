'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type {
  LockUserRequest,
  UpdateUserRolesRequest,
  CreateRoleRequest,
  CreateRoleApiRequest,
  RoleListParams,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  UserListParams,
  UserProfileListParams,
  BanUserRequest,
  CreatePermissionApiRequest,
  UpdatePermissionApiRequest,
  AuditLogListParams,
} from '../types/admin.type';

export const ADMIN_QUERY_KEY = 'admin';

export function useAdmin() {
  const queryClient = useQueryClient();

  // User Profiles
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

  // User Management
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

  const useRolesApi = (params?: RoleListParams) =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles-api', params],
      queryFn: () => adminApi.getRolesApi(params),
    });

  const useUserRoles = (userId: string | null) =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'user-roles', userId],
      queryFn: () => adminApi.getUserRoles(userId as string),
      enabled: !!userId,
    });

  const useRoleById = (roleId: string | null) => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles', roleId],
      queryFn: () => adminApi.getRoleById(roleId as string),
      enabled: !!roleId,
    });
  };

  const useRolePermissions = (roleId: string | null) => {
    return useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'roles', roleId, 'permissions'],
      queryFn: () => adminApi.getRolePermissions(roleId as string),
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

  const createRoleApiMutation = useMutation({
    mutationFn: (request: CreateRoleApiRequest) => adminApi.createRoleApi(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles-api'] });
    },
  });

  const deleteRoleApiMutation = useMutation({
    mutationFn: (roleId: string) => adminApi.deleteRoleApi(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'roles-api'] });
    },
  });

  const assignUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminApi.assignUserRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'user-roles', userId] });
    },
  });

  const revokeUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminApi.revokeUserRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'user-roles', userId] });
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

  const useAllPermissionsV1 = () =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'permissions-v1'],
      queryFn: () => adminApi.getAllPermissionsV1(),
      staleTime: 60_000,
    });

  const usePermissionsByRole = (roleId: string | null) =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'permissions-v1', 'role', roleId],
      queryFn: () => adminApi.getPermissionsByRoleV1(roleId as string),
      enabled: !!roleId,
    });

  // Permission Mutations
  const createPermissionMutation = useMutation({
    mutationFn: (request: CreatePermissionApiRequest) => adminApi.createPermission(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'permissions-v1'] });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdatePermissionApiRequest }) =>
      adminApi.updatePermission(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'permissions-v1'] });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'permissions-v1'] });
    },
  });

  const assignPermissionToRoleMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      adminApi.assignPermissionToRole(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'permissions-v1', 'role', roleId] });
    },
  });

  const revokePermissionFromRoleMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      adminApi.revokePermissionFromRole(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, 'permissions-v1', 'role', roleId] });
    },
  });

  // Audit Logs
  const useAuditLogs = (params?: AuditLogListParams) =>
    useQuery({
      queryKey: [ADMIN_QUERY_KEY, 'audit-logs', params],
      queryFn: () => adminApi.getAuditLogs(params),
    });

  return {
    // User Queries
    useUsers,

    // User Mutations
    lockUser: lockUserMutation.mutateAsync,
    unlockUser: unlockUserMutation.mutateAsync,
    updateUserRoles: updateUserRolesMutation.mutateAsync,

    // Role Queries
    useRoles,
    useRolesApi,
    useUserRoles,
    useRoleById,
    useRolePermissions,

    // Role Mutations
    createRole: createRoleMutation.mutateAsync,
    createRoleApi: createRoleApiMutation.mutateAsync,
    deleteRoleApi: deleteRoleApiMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    deleteRole: deleteRoleMutation.mutateAsync,
    updateRolePermissions: updateRolePermissionsMutation.mutateAsync,
    assignUserRole: assignUserRoleMutation.mutateAsync,
    revokeUserRole: revokeUserRoleMutation.mutateAsync,

    // Permission Queries
    usePermissions,
    useAllPermissionsV1,
    usePermissionsByRole,

    // Permission Mutations
    createPermission: createPermissionMutation.mutateAsync,
    updatePermission: updatePermissionMutation.mutateAsync,
    deletePermission: deletePermissionMutation.mutateAsync,
    assignPermissionToRole: assignPermissionToRoleMutation.mutateAsync,
    revokePermissionFromRole: revokePermissionFromRoleMutation.mutateAsync,
    isCreatingPermission: createPermissionMutation.isPending,
    isUpdatingPermission: updatePermissionMutation.isPending,
    isDeletingPermission: deletePermissionMutation.isPending,
    isTogglingPermission: assignPermissionToRoleMutation.isPending || revokePermissionFromRoleMutation.isPending,

    // User Profiles
    useUserProfiles,
    banUser: banUserMutation.mutateAsync,
    unbanUser: unbanUserMutation.mutateAsync,
    isBanningUser: banUserMutation.isPending,
    isUnbanningUser: unbanUserMutation.isPending,

    // Loading States
    isLockingUser: lockUserMutation.isPending,
    isUnlockingUser: unlockUserMutation.isPending,
    isUpdatingUserRoles: updateUserRolesMutation.isPending,
    isCreatingRole: createRoleMutation.isPending || createRoleApiMutation.isPending,
    isDeletingRole: deleteRoleMutation.isPending || deleteRoleApiMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isUpdatingRolePermissions: updateRolePermissionsMutation.isPending,
    isAssigningRole: assignUserRoleMutation.isPending,
    isRevokingRole: revokeUserRoleMutation.isPending,

    // Audit Logs
    useAuditLogs,
  };
}