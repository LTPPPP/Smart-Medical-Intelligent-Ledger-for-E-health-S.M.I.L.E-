"use client";

// Same content component as /specialties, rendered without its own
// AppShell so it shares admin/layout.tsx's instance — no sidebar remount
// when navigating within the admin "Clinic" nav group.
import { SpecialtiesPageContent } from "../../specialties/SpecialtiesPageContent";

export default function AdminSpecialtiesPage() {
	return <SpecialtiesPageContent />;
}
