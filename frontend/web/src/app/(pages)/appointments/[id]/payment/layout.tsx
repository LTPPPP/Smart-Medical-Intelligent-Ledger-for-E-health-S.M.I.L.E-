"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { PAYMENT_ROLES } from "@/shared/constants/roles";

export default function AppointmentPaymentLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={PAYMENT_ROLES}>{children}</ProtectedRoute>
	);
}
