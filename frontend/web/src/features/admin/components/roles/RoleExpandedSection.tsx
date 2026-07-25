"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type { RoleApi, PermissionApi } from "@/features/admin/types/admin.type";

import { PermissionMatrix } from "./PermissionMatrix";

interface RoleExpandedSectionProps {
	role: RoleApi;
	onAddPermission: () => void;
}

export function RoleExpandedSection({
	role,
	onAddPermission,
}: RoleExpandedSectionProps) {
	const {
		useAllPermissionsV1,
		usePermissionsByRole,
		assignPermissionToRole,
		revokePermissionFromRole,
		isTogglingPermission,
	} = useAdmin();

	const { data: allPermissions = [], isLoading: isLoadingAll } =
		useAllPermissionsV1();
	const { data: rolePermissions = [], isLoading: isLoadingRole } =
		usePermissionsByRole(role.role_id);

	const [feedback, setFeedback] = useState<Record<string, "success" | "error">>(
		{},
	);
	const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	useEffect(
		() => () => {
			for (const t of Object.values(timersRef.current)) clearTimeout(t);
		},
		[],
	);

	const handleToggle = useCallback(
		async (perm: PermissionApi, assigned: boolean) => {
			let result: "success" | "error" = "success";
			try {
				if (assigned) {
					await revokePermissionFromRole({
						roleId: role.role_id,
						permissionId: perm.permission_id,
					});
				} else {
					await assignPermissionToRole({
						roleId: role.role_id,
						permissionId: perm.permission_id,
					});
				}
			} catch {
				result = "error";
			}
			setFeedback((f) => ({ ...f, [perm.permission_id]: result }));
			clearTimeout(timersRef.current[perm.permission_id]);
			timersRef.current[perm.permission_id] = setTimeout(() => {
				setFeedback((f) => {
					const next = { ...f };
					delete next[perm.permission_id];
					return next;
				});
			}, 500);
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
			feedback={feedback}
			onToggle={handleToggle}
			onAddPermission={onAddPermission}
		/>
	);
}
