import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { PATIENT_DIRECTORY_ROLES } from "@/shared/constants";

export default function PatientsLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={PATIENT_DIRECTORY_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
