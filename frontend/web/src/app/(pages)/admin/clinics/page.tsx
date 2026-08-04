"use client";

// Same content component as /clinics, rendered without its own AppShell
// so it shares admin/layout.tsx's instance — no sidebar remount when
// navigating within the admin "Clinic" nav group.
import { ClinicsPageContent } from "../../clinics/ClinicsPageContent";

export default function AdminClinicsPage() {
	return <ClinicsPageContent />;
}
