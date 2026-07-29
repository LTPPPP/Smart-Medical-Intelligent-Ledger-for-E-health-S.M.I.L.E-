"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { FRONT_DESK_ROLES } from "@/shared/constants/roles";

// A patient must never edit their own appointment record (only view/cancel it) —
// editing is a front-desk action, mirroring FRONT_DESK_ROLES used for check-in.
export default function EditAppointmentLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={FRONT_DESK_ROLES}>{children}</ProtectedRoute>
	);
}
