import { hasAnyRole, ROLE } from "@/shared/constants/roles";

export const SERVICE_MANAGEMENT_ROLES = [ROLE.ADMIN];

export function canManageServices(
	userRoles: readonly string[] | undefined,
): boolean {
	return hasAnyRole(userRoles, SERVICE_MANAGEMENT_ROLES);
}
