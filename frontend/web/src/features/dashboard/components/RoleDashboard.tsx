"use client";

import { useAuthStore } from "@/features/auth/store/authStore";
import { resolveDashboardKind } from "@/shared/constants/nav";

import { AdminDashboard } from "./AdminDashboard";
import { DoctorDashboard } from "./DoctorDashboard";
import { PatientDashboard } from "./PatientDashboard";
import { StaffDashboard } from "./StaffDashboard";

// Pick Dashboard View
export function RoleDashboard() {
	const { user } = useAuthStore();
	const kind = resolveDashboardKind(user?.roles);

	switch (kind) {
		case "admin":
			return <AdminDashboard />;
		case "manager":
			return <StaffDashboard staffRole="manager" />;
		case "doctor":
			return <DoctorDashboard />;
		case "receptionist":
			return <StaffDashboard staffRole="receptionist" />;
		case "nurse":
			return <StaffDashboard staffRole="nurse" />;
		case "patient":
		default:
			return <PatientDashboard />;
	}
}
