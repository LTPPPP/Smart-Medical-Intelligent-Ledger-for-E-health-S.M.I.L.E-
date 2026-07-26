"use client";

import { RoleDashboard } from "@/features/dashboard/components/RoleDashboard";
import { AppShell } from "@/shared/components/layout/AppShell";

export default function DashboardPage() {
	return (
		<AppShell>
			<RoleDashboard />
		</AppShell>
	);
}
