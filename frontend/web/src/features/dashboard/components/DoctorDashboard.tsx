"use client";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { ShiftTimeline } from "@/features/schedule/components/ShiftTimeline";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import {
	DashEmpty,
	DashError,
	DashLoading,
	DashPanel,
	DashStat,
	DashboardHeader,
	STATUS_STYLE,
	fmtDate,
	num,
} from "./DashboardPrimitives";

interface TodaySummary {
	total?: number | string;
	pending?: number | string;
	confirmed?: number | string;
	completed?: number | string;
	cancelled?: number | string;
}
interface ScheduleItem {
	schedule_id: string;
	work_date: string;
	status?: string;
	clinic?: { clinic_name?: string } | null;
	shift?: {
		shift_name?: string;
		start_time?: string;
		end_time?: string;
	} | null;
}
interface AppointmentItem {
	appointment_id: string;
	appointment_code?: string;
	appointment_date: string;
	appointment_time?: string;
	duration_minutes?: number;
	status?: string;
	clinic?: { clinic_name?: string } | null;
	service?: { service_name?: string } | null;
}
interface DoctorDashboard {
	doctor_id: string;
	date: string;
	today_summary: TodaySummary | null;
	upcoming_schedules: ScheduleItem[];
	upcoming_appointments: AppointmentItem[];
}

export function DoctorDashboard() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const doctorId = user?.userId ?? "";
	const doctorLabel =
		user?.fullName ??
		user?.email ??
		(doctorId
			? `${t("dashboard.doctor", "Doctor")} ${doctorId.slice(0, 8)}`
			: t("dashboard.signedInDoctor", "Signed-in doctor"));

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
		queryKey: ["reports", "dashboard-doctor", doctorId],
		queryFn: () =>
			apiClient.get<{ data?: DoctorDashboard } | DoctorDashboard>(
				API_ENDPOINTS.REPORTS.DASHBOARD_DOCTOR,
				{
					params: { doctor_id: doctorId },
				},
			),
		enabled: !!doctorId,
	});

	const dash = (data as { data?: DoctorDashboard } | undefined)?.data;
	const summary = dash?.today_summary ?? null;
	const schedules = dash?.upcoming_schedules ?? [];
	const appointments = dash?.upcoming_appointments ?? [];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
			<DashboardHeader
				eyebrow={t("dashboard.doctorWorkspace", "Doctor Workspace")}
				title={`${t("dashboard.welcomeBack", "Welcome back,")} ${user?.fullName ?? t("dashboard.doctor", "Doctor")}`}
				subtitle={`${t("dashboard.today", "Today")} (${fmtDate(dash?.date)}) - ${doctorLabel}`}
				icon="lucide:user-cog"
			/>

			<div
				className="flex flex-wrap items-end gap-4 rounded-2xl border p-5 backdrop-blur-xl"
				style={{
					background: "var(--surface-card-bg)",
					borderColor: "var(--surface-card-border)",
				}}
			>
				<div className="flex flex-col gap-1">
					<label
						htmlFor="doctor"
						className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description"
					>
						{t("dashboard.doctor", "Doctor")}
					</label>
					<input
						id="doctor"
						value={doctorId}
						readOnly
						aria-label={doctorLabel}
						className="rounded-xl border px-3 py-2 font-inter text-sm text-smile-title outline-none focus:border-smile-primary/40"
						style={{
							background: "var(--surface-input-bg)",
							borderColor: "var(--surface-input-border)",
						}}
					/>
					<span className="font-inter text-xs text-smile-description">
						{doctorLabel}
					</span>
				</div>
				<button
					type="button"
					onClick={() => refetch()}
					disabled={isFetching}
					className="ml-auto flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2.5 font-inter text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-50"
				>
					<Icon
						icon={isFetching ? "lucide:loader-2" : "lucide:refresh-cw"}
						width={15}
						className={isFetching ? "animate-spin" : ""}
					/>
					{t("dashboard.refresh", "Refresh")}
				</button>
			</div>

			{isError && (
				<DashError
					label={t(
						"dashboard.failedToLoadDoctorDashboard",
						"Failed to load doctor dashboard.",
					)}
					error={error}
					operation="doctor dashboard"
					onRetry={() => refetch()}
				/>
			)}

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				<DashStat
					label={t("dashboard.todayTotal", "Today Total")}
					value={num(summary?.total)}
					icon="lucide:calendar-days"
					loading={isLoading}
					accent
				/>
				<DashStat
					label={t("dashboard.pending", "Pending")}
					value={num(summary?.pending)}
					icon="lucide:clock"
					loading={isLoading}
				/>
				<DashStat
					label={t("dashboard.confirmed", "Confirmed")}
					value={num(summary?.confirmed)}
					icon="lucide:badge-check"
					loading={isLoading}
				/>
				<DashStat
					label={t("dashboard.completed", "Completed")}
					value={num(summary?.completed)}
					icon="lucide:check-circle-2"
					loading={isLoading}
				/>
				<DashStat
					label={t("dashboard.cancelled", "Cancelled")}
					value={num(summary?.cancelled)}
					icon="lucide:x-circle"
					loading={isLoading}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DashPanel
					title={t(
						"dashboard.upcomingSchedules",
						"Upcoming Schedules (7 days)",
					)}
					icon="lucide:calendar-clock"
				>
					{isLoading ? (
						<DashLoading />
					) : schedules.length === 0 ? (
						<DashEmpty
							label={t(
								"dashboard.noUpcomingSchedules",
								"No upcoming schedules",
							)}
						/>
					) : (
						<ul
							className="divide-y"
							style={{ borderColor: "var(--surface-panel-border)" }}
						>
							{schedules.map((s) => {
								const dayAppointments = appointments.filter(
									(a) => a.appointment_date === s.work_date,
								);
								return (
									<li
										key={s.schedule_id}
										className="flex flex-col gap-2 px-6 py-3.5"
									>
										<div className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="font-inter text-sm font-medium text-smile-title">
													{fmtDate(s.work_date)}
												</p>
												<p className="truncate font-inter text-xs text-smile-description">
													{s.clinic?.clinic_name ?? "—"}
													{s.shift?.shift_name
														? ` · ${s.shift.shift_name}`
														: ""}
												</p>
											</div>
											<span
												className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[s.status ?? ""] ?? "text-smile-description"}`}
											>
												{s.status ?? "—"}
											</span>
										</div>
										{s.shift?.start_time && s.shift?.end_time && (
											<ShiftTimeline
												startTime={s.shift.start_time}
												endTime={s.shift.end_time}
												appointments={dayAppointments.map((a) => ({
													time: a.appointment_time ?? "00:00",
													duration_minutes: a.duration_minutes,
												}))}
											/>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</DashPanel>

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
								<li
									key={a.appointment_id}
									className="flex items-center justify-between gap-4 px-6 py-3.5"
								>
									<div className="min-w-0">
										<p className="truncate font-inter text-sm font-medium text-smile-title">
											{a.service?.service_name ??
												a.appointment_code ??
												t("dashboard.appointmentFallback", "Appointment")}
										</p>
										<p className="truncate font-inter text-xs text-smile-description">
											{fmtDate(a.appointment_date)}
											{a.appointment_time ? ` · ${a.appointment_time}` : ""}
											{a.clinic?.clinic_name
												? ` · ${a.clinic.clinic_name}`
												: ""}
										</p>
									</div>
									<span
										className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ""] ?? "text-smile-description"}`}
									>
										{a.status ?? "—"}
									</span>
								</li>
							))}
						</ul>
					)}
				</DashPanel>
			</div>
		</div>
	);
}
