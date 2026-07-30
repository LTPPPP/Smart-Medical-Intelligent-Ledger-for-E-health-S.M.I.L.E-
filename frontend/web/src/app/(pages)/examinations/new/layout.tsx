"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { EXAMINATION_CREATE_ROLES } from "@/shared/constants/roles";

// Nurse excluded
export default function NewExaminationLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={EXAMINATION_CREATE_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
