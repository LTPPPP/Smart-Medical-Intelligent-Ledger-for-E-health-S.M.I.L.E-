"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { PATIENT_REGISTRATION_ROLES } from "@/shared/constants/roles";

export default function EditPatientLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={PATIENT_REGISTRATION_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
