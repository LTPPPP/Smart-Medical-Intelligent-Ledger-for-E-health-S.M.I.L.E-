"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { ENV } from "@/shared/constants/env";
import { ROUTES } from "@/shared/constants/routes";

import {
	DashboardHeader,
	DashPanel,
	DashLoading,
	DashEmpty,
	DashError,
	DashQuickLink,
	STATUS_STYLE,
	fmtDate,
} from "./DashboardPrimitives";

interface Patient {
	patient_id: string;
	full_name?: string;
	patient_code?: string;
}
interface AppointmentItem {
	appointment_id: string;
	appointment_code?: string;
	appointment_date: string;
	appointment_time?: string;
	status?: string;
	clinic?: { clinic_name?: string } | null;
	service?: { service_name?: string } | null;
}
interface TreatmentPlan {
	plan_id: string;
	plan_name?: string | null;
	objectives?: string | null;
	duration_weeks?: number | null;
	status?: string;
}
interface ExamSession {
	session_id: string;
	session_date?: string;
	chief_complaint?: string | null;
	status?: string;
}
interface PatientDashboard {
	patient_id: string;
	upcoming_appointments: AppointmentItem[];
	active_treatment_plans: TreatmentPlan[];
	recent_sessions: ExamSession[];
}

export function PatientDashboard() {
	const { user } = useAuthStore();

	// This view is only ever routed to the logged-in PATIENT (see RoleDashboard) — staff use
	// AdminDashboard/DoctorDashboard/StaffDashboard instead. So we resolve the caller's own
	// patient record via /patients/me (gateway-injected x-auth-user-id), not the staff-only
	// /patients directory list, which a PATIENT is intentionally forbidden from reading (403).
	const { data: meRes } = useQuery({
		queryKey: ["patients", "me"],
		queryFn: () =>
			apiClient.get<Patient | null>(`${ENV.SERVICES.GATEWAY}/patients/me`),
	});

	const patientId =
		(meRes as { data?: Patient | null } | undefined)?.data?.patient_id ?? "";

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["reports", "dashboard-patient", patientId],
		queryFn: () =>
			apiClient.get<{ data?: PatientDashboard } | PatientDashboard>(
				API_ENDPOINTS.REPORTS.DASHBOARD_PATIENT,
				{
					params: { patient_id: patientId },
				},
			),
		enabled: !!patientId,
	});

	const dash = (data as { data?: PatientDashboard } | undefined)?.data;
	const appointments = dash?.upcoming_appointments ?? [];
	const plans = dash?.active_treatment_plans ?? [];
	const sessions = dash?.recent_sessions ?? [];

	const quickLinks = [
		{
			href: ROUTES.APPOINTMENT_NEW,
			icon: "lucide:calendar-plus",
			label: "Book Appointment",
			description: "Schedule a new dental visit",
		},
		{
			href: ROUTES.CLINICS,
			icon: "lucide:hospital",
			label: "Find Clinics",
			description: "Discover dental clinics near you",
		},
		{
			href: ROUTES.CHAT,
			icon: "lucide:bot-message-square",
			label: "Booking Assistant",
			description: "Chat to book or manage visits",
		},
	];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
			<DashboardHeader
				eyebrow="My Care"
				title={`Welcome back, ${user?.fullName ?? "there"}`}
				subtitle="Your appointments, treatment plans, and recent visits at a glance."
				icon="lucide:user"
			/>

			{/* Quick access */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{quickLinks.map((l) => (
					<DashQuickLink key={l.href} {...l} />
				))}
			</div>

			{isError && (
				<DashError
					label="Failed to load your dashboard."
					onRetry={() => refetch()}
				/>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<DashPanel title="Upcoming Appointments" icon="lucide:calendar-check">
					{isLoading ? (
						<DashLoading />
					) : appointments.length === 0 ? (
						<DashEmpty label="No upcoming appointments" />
					) : (
						<ul
							className="divide-y"
							style={{ borderColor: "var(--surface-panel-border)" }}
						>
							{appointments.map((a) => (
								<li key={a.appointment_id} className="px-6 py-3.5">
									<div className="flex items-center justify-between gap-3">
										<p className="truncate font-inter text-sm font-medium text-smile-title">
											{a.service?.service_name ??
												a.appointment_code ??
												"Appointment"}
										</p>
										<span
											className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ""] ?? "text-smile-description"}`}
										>
											{a.status ?? "—"}
										</span>
									</div>
									<p className="mt-0.5 truncate font-inter text-xs text-smile-description">
										{fmtDate(a.appointment_date)}
										{a.appointment_time ? ` · ${a.appointment_time}` : ""}
										{a.clinic?.clinic_name ? ` · ${a.clinic.clinic_name}` : ""}
									</p>
								</li>
							))}
						</ul>
					)}
				</DashPanel>

				<DashPanel title="Active Treatment Plans" icon="lucide:clipboard-list">
					{isLoading ? (
						<DashLoading />
					) : plans.length === 0 ? (
						<DashEmpty label="No active treatment plans" />
					) : (
						<ul
							className="divide-y"
							style={{ borderColor: "var(--surface-panel-border)" }}
						>
							{plans.map((p) => (
								<li key={p.plan_id} className="px-6 py-3.5">
									<div className="flex items-center justify-between gap-3">
										<p className="truncate font-inter text-sm font-medium text-smile-title">
											{p.plan_name ?? "Treatment plan"}
										</p>
										<span
											className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[p.status ?? ""] ?? "text-smile-description"}`}
										>
											{p.status ?? "—"}
										</span>
									</div>
									{p.objectives && (
										<p className="mt-0.5 line-clamp-2 font-inter text-xs text-smile-description">
											{p.objectives}
										</p>
									)}
									{typeof p.duration_weeks === "number" && (
										<p className="mt-0.5 font-inter text-xs text-smile-primary">
											{p.duration_weeks} week{p.duration_weeks === 1 ? "" : "s"}
										</p>
									)}
								</li>
							))}
						</ul>
					)}
				</DashPanel>

				<DashPanel title="Recent Sessions" icon="lucide:stethoscope">
					{isLoading ? (
						<DashLoading />
					) : sessions.length === 0 ? (
						<DashEmpty label="No recent sessions" />
					) : (
						<ul
							className="divide-y"
							style={{ borderColor: "var(--surface-panel-border)" }}
						>
							{sessions.map((s) => (
								<li key={s.session_id} className="px-6 py-3.5">
									<div className="flex items-center justify-between gap-3">
										<p className="truncate font-inter text-sm font-medium text-smile-title">
											{s.chief_complaint ?? "Examination session"}
										</p>
										<span
											className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[s.status ?? ""] ?? "text-smile-description"}`}
										>
											{s.status ?? "—"}
										</span>
									</div>
									<p className="mt-0.5 font-inter text-xs text-smile-description">
										{fmtDate(s.session_date)}
									</p>
								</li>
							))}
						</ul>
					)}
				</DashPanel>
			</div>
		</div>
	);
}
