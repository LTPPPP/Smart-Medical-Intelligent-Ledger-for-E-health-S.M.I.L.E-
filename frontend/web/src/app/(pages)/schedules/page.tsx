"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { AppShell } from "@/shared/components/layout/AppShell";
import { SCHEDULE_HUB_ROLES } from "@/shared/constants/roles";

import { SchedulesPageContent } from "./SchedulesPageContent";

export default function SchedulesPage() {
	return (
		<ProtectedRoute requiredRoles={SCHEDULE_HUB_ROLES}>
			<AppShell>
				<SchedulesPageContent />
			</AppShell>
		</ProtectedRoute>
	);
}
