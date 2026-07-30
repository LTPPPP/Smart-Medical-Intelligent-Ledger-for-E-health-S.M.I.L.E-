"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { APPOINTMENT_EDIT_ROLES } from "@/shared/constants/roles";

// Reception only
export default function EditAppointmentLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={APPOINTMENT_EDIT_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
