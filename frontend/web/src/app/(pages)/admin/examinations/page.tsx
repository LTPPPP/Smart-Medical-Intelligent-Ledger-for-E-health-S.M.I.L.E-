"use client";

// Same content component as /examinations, rendered without its own
// AppShell so it shares admin/layout.tsx's instance — no sidebar remount
// when navigating within the admin "Clinic" nav group.
import { ExaminationsPageContent } from "../../examinations/ExaminationsPageContent";

export default function AdminExaminationsPage() {
	return <ExaminationsPageContent />;
}
