"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { BOOKING_ROLES } from "@/shared/constants/roles";

export default function NewAppointmentLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={BOOKING_ROLES}>{children}</ProtectedRoute>
	);
}
