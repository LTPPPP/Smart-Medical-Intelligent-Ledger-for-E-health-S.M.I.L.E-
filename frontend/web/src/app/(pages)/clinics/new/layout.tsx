"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { CLINIC_MANAGEMENT_ROLES } from "@/shared/constants/roles";

export default function NewClinicLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={CLINIC_MANAGEMENT_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
