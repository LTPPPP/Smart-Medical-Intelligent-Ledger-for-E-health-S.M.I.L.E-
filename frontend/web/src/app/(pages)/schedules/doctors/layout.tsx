import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { SCHEDULE_MANAGEMENT_ROLES } from "@/shared/constants";

export default function ScheduleManagementLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={SCHEDULE_MANAGEMENT_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
