'use client';

import { useCallback } from 'react';

import type { RoleApi, PermissionApi } from '@/features/admin/types/admin.type';
import { useAdmin } from '@/features/admin/hooks/useAdmin';
import { PermissionMatrix } from './PermissionMatrix';

interface RoleExpandedSectionProps {
    role: RoleApi;
    onAddPermission: () => void;
}

export function RoleExpandedSection({ role, onAddPermission }: RoleExpandedSectionProps) {
    const {
        useAllPermissionsV1,
        usePermissionsByRole,
        assignPermissionToRole,
        revokePermissionFromRole,
        isTogglingPermission,
    } = useAdmin();

    const { data: allPermissions = [], isLoading: isLoadingAll } = useAllPermissionsV1();
    const { data: rolePermissions = [], isLoading: isLoadingRole } = usePermissionsByRole(role.role_id);

    const handleToggle = useCallback(
        async (perm: PermissionApi, assigned: boolean) => {
            if (assigned) {
                await revokePermissionFromRole({ roleId: role.role_id, permissionId: perm.permission_id });
            } else {
                await assignPermissionToRole({ roleId: role.role_id, permissionId: perm.permission_id });
            }
        },
        [role.role_id, assignPermissionToRole, revokePermissionFromRole],
    );

    return (
        <PermissionMatrix
            role={role}
            allPermissions={allPermissions}
            rolePermissions={rolePermissions}
            isLoadingAll={isLoadingAll}
            isLoadingRole={isLoadingRole}
            isToggling={isTogglingPermission}
            onToggle={handleToggle}
            onAddPermission={onAddPermission}
        />
    );
}
