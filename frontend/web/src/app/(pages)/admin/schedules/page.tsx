"use client";

// Same content component as /schedules, rendered without its own
// AppShell/ProtectedRoute — admin/layout.tsx already gates by ADMIN_ROLES,
// a subset of SCHEDULE_HUB_ROLES — so it shares admin/layout.tsx's AppShell
// instance and doesn't remount the sidebar within the admin "Clinic" group.
import { SchedulesPageContent } from "../../schedules/SchedulesPageContent";

export default function AdminSchedulesPage() {
	return <SchedulesPageContent />;
}
