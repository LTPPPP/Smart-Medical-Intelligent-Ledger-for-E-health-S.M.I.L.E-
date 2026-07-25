import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { MY_SCHEDULE_ROLES } from "@/shared/constants";

export default function MyScheduleLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={MY_SCHEDULE_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
