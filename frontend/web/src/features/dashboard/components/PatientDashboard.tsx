"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { isValid, parseISO } from "date-fns";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { Calendar } from "@/shared/components/ui/calendar";
import { ENV } from "@/shared/constants/env";
import { ROUTES } from "@/shared/constants/routes";

import {
	DashEmpty,
	DashError,
	DashLoading,
	DashPanel,
	DashQuickLink,
	DashboardHeader,
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
	clinic?: { clinic_name?: string; address?: string } | null;
	service?: { service_name?: string } | null;
}
interface PatientDashboard {
	patient_id: string;
	upcoming_appointments: AppointmentItem[];
}

export function PatientDashboard() {
	const { t } = useTranslation();
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

	const { data, isLoading, isError, error, refetch } = useQuery({
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

	// Highlight every day that has a booking so the calendar doubles as an
	// at-a-glance "when am I next at the clinic" view.
	const bookedDates = useMemo(
		() =>
			appointments
				.map((a) => {
					const d = parseISO(a.appointment_date);
					return isValid(d) ? d : null;
				})
				.filter((d): d is Date => d !== null),
		[appointments],
	);

	const quickLinks = [
		{
			href: ROUTES.APPOINTMENT_NEW,
			icon: "lucide:calendar-plus",
			label: t("dashboard.bookAppointment", "Book Appointment"),
			description: t(
				"dashboard.scheduleNewVisit",
				"Schedule a new dental visit",
			),
		},
		{
			href: ROUTES.CHAT,
			icon: "lucide:bot-message-square",
			label: t("dashboard.bookingAssistant", "Booking Assistant"),
			description: t(
				"dashboard.chatToBookOrManage",
				"Chat to book or manage visits",
			),
		},
	];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
			<DashboardHeader
				eyebrow={t("dashboard.myCare", "My Care")}
				title={`${t("dashboard.welcomeBack", "Welcome back,")} ${user?.fullName ?? t("dashboard.there", "there")}`}
				subtitle={t(
					"dashboard.yourAppointmentsSubtitle",
					"Your appointments at a glance.",
				)}
				icon="lucide:user"
			/>

			{/* Quick access */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{quickLinks.map((l) => (
					<DashQuickLink key={l.href} {...l} />
				))}
			</div>

			{isError && (
				<DashError
					label={t(
						"dashboard.failedToLoadYourDashboard",
						"Failed to load your dashboard.",
					)}
					error={error}
					operation="patient dashboard"
					onRetry={() => refetch()}
				/>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DashPanel
					title={t("dashboard.upcomingAppointments", "Upcoming Appointments")}
					icon="lucide:calendar-check"
				>
					{isLoading ? (
						<DashLoading />
					) : appointments.length === 0 ? (
						<DashEmpty
							label={t(
								"dashboard.noUpcomingAppointments",
								"No upcoming appointments",
							)}
						/>
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
												t("dashboard.appointmentFallback", "Appointment")}
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
									</p>
									{(a.clinic?.clinic_name || a.clinic?.address) && (
										<p className="mt-0.5 flex items-center gap-1 truncate font-inter text-xs text-smile-primary">
											<span className="shrink-0">📍</span>
											{[a.clinic?.clinic_name, a.clinic?.address]
												.filter(Boolean)
												.join(" · ")}
										</p>
									)}
								</li>
							))}
						</ul>
					)}
				</DashPanel>

				<DashPanel
					title={t("dashboard.bookingCalendar", "Booking Calendar")}
					icon="lucide:calendar-days"
				>
					{isLoading ? (
						<DashLoading />
					) : (
						<div className="flex flex-col items-center gap-2 px-4 py-3">
							<Calendar
								mode="multiple"
								selected={[]}
								modifiers={{ booked: bookedDates }}
								modifiersClassNames={{
									booked:
										"relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-smile-primary",
								}}
							/>
							<p className="font-inter text-xs text-smile-description">
								<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-smile-primary" />
								{t(
									"dashboard.daysWithBookedAppointment",
									"Days with a booked appointment",
								)}
							</p>
						</div>
					)}
				</DashPanel>
			</div>
		</div>
	);
}
