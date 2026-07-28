"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { PATIENT_REGISTRATION_ROLES } from "@/shared/constants/roles";

export default function NewPatientLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={PATIENT_REGISTRATION_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
