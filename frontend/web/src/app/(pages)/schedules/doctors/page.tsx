"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	TransferModal,
	ChangesModal,
} from "@/features/schedule/components/ScheduleModals";
import { ShiftTimeline } from "@/features/schedule/components/ShiftTimeline";
import { useDoctorNames } from "@/features/schedule/hooks/useDoctorName";
import {
	SCHEDULE_STATUS_STYLE,
	unwrapArr,
} from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Calendar, CalendarDayButton } from "@/shared/components/ui/calendar";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface Schedule {
	schedule_id: string;
	doctor_id: string;
	clinic_id: string;
	shift_id?: string | null;
	work_date: string;
	max_patients?: number;
	status?: string;
	clinic?: { clinic_name?: string };
	shift?: { shift_name?: string; start_time?: string; end_time?: string };
}
interface AppointmentRow {
	appointment_date: string;
	appointment_time?: string;
	duration_minutes?: number;
}
interface Clinic {
	clinic_id: string;
	clinic_name: string;
}

const TEAL = "#2E7EAE";

/** Adds a small dot under any day that has a registered schedule. */
function makeScheduleDayButton(scheduleDates: Set<string>) {
	return function ScheduleDayButton(
		props: React.ComponentProps<typeof CalendarDayButton>,
	) {
		const hasSchedule = scheduleDates.has(format(props.day.date, "yyyy-MM-dd"));
		return (
			<div className="relative h-full w-full">
				<CalendarDayButton {...props} />
				{hasSchedule && (
					<span
						className="pointer-events-none absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
						style={{ background: TEAL }}
					/>
				)}
			</div>
		);
	};
}

export default function WorkSchedulesPage() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [transferFor, setTransferFor] = useState<Schedule | null>(null);
	const [changesFor, setChangesFor] = useState<Schedule | null>(null);
	const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
	const [activeDay, setActiveDay] = useState<string | null>(null);
	const [clinicId, setClinicId] = useState("");
	const [month, setMonth] = useState<Date>(new Date());

	const monthKey = format(month, "yyyy-MM");
	const { data, isLoading, isFetching, isError, refetch } = useQuery({
		queryKey: ["doctor-schedules", "list", monthKey, clinicId],
		queryFn: async () => {
			const baseParams: Record<string, string | number> = {
				date_from: format(startOfMonth(month), "yyyy-MM-dd"),
				date_to: format(endOfMonth(month), "yyyy-MM-dd"),
				limit: 50,
			};
			if (clinicId) baseParams.clinic_id = clinicId;

			// The Backend Caps `limit` At 50 — Loop Pages So A Busy Month
			// Doesn't Get Silently Truncated (`total` Comes Back In Every Page).
			let page = 1;
			let all: Schedule[] = [];
			for (;;) {
				const res = await apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, {
					params: { ...baseParams, page },
				});
				const body = res.data as { data?: Schedule[]; total?: number };
				const rows = Array.isArray(body?.data) ? body.data : [];
				all = all.concat(rows);
				const total = body?.total ?? all.length;
				if (rows.length === 0 || all.length >= total) break;
				page += 1;
			}
			return all;
		},
	});
	const { data: clinicRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicRes), [clinicRes]);
	const schedules = useMemo(() => data ?? [], [data]);

	const scheduleDates = useMemo(
		() => new Set(schedules.map((s) => s.work_date)),
		[schedules],
	);
	const ScheduleDayButton = useMemo(
		() => makeScheduleDayButton(scheduleDates),
		[scheduleDates],
	);

	const doctorIds = useMemo(
		() => schedules.map((s) => s.doctor_id),
		[schedules],
	);
	const doctorNames = useDoctorNames(doctorIds);

	const activeDaySchedules = useMemo(
		() => (activeDay ? schedules.filter((s) => s.work_date === activeDay) : []),
		[activeDay, schedules],
	);
	const activeDoctorIds = useMemo(
		() => Array.from(new Set(activeDaySchedules.map((s) => s.doctor_id))),
		[activeDaySchedules],
	);
	const appointmentQueries = useQueries({
		queries: activeDoctorIds.map((id) => ({
			queryKey: ["appointments", "by-doctor", id],
			queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(id)),
			enabled: !!activeDay,
		})),
	});
	const appointmentsByDoctor = useMemo(() => {
		const map: Record<string, AppointmentRow[]> = {};
		activeDoctorIds.forEach((id, i) => {
			map[id] = unwrapArr<AppointmentRow>(appointmentQueries[i]?.data).filter(
				(a) => a.appointment_date === activeDay,
			);
		});
		return map;
	}, [activeDoctorIds, appointmentQueries, activeDay]);

	const cancel = useMutation({
		// No Dedicated Cancel Route Exists — Cancelling Is A Status Transition
		// Through The Same PATCH `update` The Edit Page Uses.
		mutationFn: (id: string) =>
			apiClient.patch(API_ENDPOINTS.SCHEDULE.UPDATE(id), {
				status: "cancelled",
				changed_by: user?.userId,
				change_reason: "Cancelled from the schedule calendar",
			}),
		onSuccess: () => {
			toast.success(t("schedule.doctors.cancelledToast", "Schedule cancelled"));
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("schedule.doctors.cancelFailedToast", "Failed to cancel"),
			),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							{t("schedule.doctors.title", "Work & On-Call Schedules")}
						</h1>
						<p className="text-sm text-smile-description">
							{schedules.length} {t("schedule.doctors.shiftsCount", "shifts")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => refetch()}
							disabled={isFetching}
							title={t("schedule.doctors.refresh", "Refresh")}
							className="flex h-10 w-10 items-center justify-center rounded-xl border text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary disabled:opacity-60 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
						>
							<Icon
								icon="lucide:refresh-cw"
								width={16}
								className={isFetching ? "animate-spin" : ""}
							/>
						</button>
						<select
							value={clinicId}
							onChange={(e) => {
								setClinicId(e.target.value);
								setActiveDay(null);
							}}
							className="h-10 rounded-xl border px-3 text-sm text-smile-title outline-none [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
						>
							<option value="">
								{t("schedule.doctors.allClinics", "All clinics")}
							</option>
							{clinics.map((c) => (
								<option key={c.clinic_id} value={c.clinic_id}>
									{c.clinic_name}
								</option>
							))}
						</select>
						<Link
							href={ROUTES.DOCTOR_SCHEDULE_NEW}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} />{" "}
							{t("schedule.doctors.newSchedule", "New Schedule")}
						</Link>
					</div>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("schedule.doctors.loading", "Loading…")}
					</div>
				)}
				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						{t("schedule.doctors.failedToLoad", "Failed to load.")}{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}
				{!isLoading && !isError && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
						<div className={`${cardBase} flex flex-col items-center gap-4 p-6`}>
							<Calendar
								month={month}
								onMonthChange={(m) => {
									setMonth(m);
									setActiveDay(null);
								}}
								components={{ DayButton: ScheduleDayButton }}
								onDayClick={(date) => {
									const key = format(date, "yyyy-MM-dd");
									if (scheduleDates.has(key)) setActiveDay(key);
								}}
								className="[--cell-size:2.75rem]"
							/>
							{schedules.length === 0 && (
								<p className="text-center text-xs text-smile-description">
									{t(
										"schedule.doctors.emptyMonth",
										"No schedules registered this month.",
									)}
								</p>
							)}
							<div className="flex items-center gap-2 text-xs text-smile-description">
								<span
									className="h-1.5 w-1.5 rounded-full"
									style={{ background: TEAL }}
								/>
								{t(
									"schedule.doctors.dayHasShiftHint",
									"day has a scheduled shift — click it to see who's on duty",
								)}
							</div>
						</div>

						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							{!activeDay ? (
								<div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-smile-description">
									<Icon
										icon="lucide:calendar-days"
										width={28}
										className="text-smile-description/50"
									/>
									<p className="text-sm">
										{t(
											"schedule.doctors.pickDayHint",
											"Pick a highlighted day to see who's on duty.",
										)}
									</p>
								</div>
							) : (
								<>
									<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
										{format(
											new Date(`${activeDay}T00:00:00`),
											"EEEE, dd MMM yyyy",
										)}
									</h2>
									{activeDaySchedules.length === 0 ? (
										<p className="py-8 text-center text-sm text-smile-description">
											{t(
												"schedule.doctors.noScheduleForDay",
												"No schedule registered for this day.",
											)}
										</p>
									) : (
										<div className="flex flex-col gap-3">
											{activeDaySchedules.map((s) => {
												const dayAppointments =
													appointmentsByDoctor[s.doctor_id] ?? [];
												return (
													<div
														key={s.schedule_id}
														className="flex flex-col gap-3 rounded-xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
													>
														<div className="flex flex-wrap items-start justify-between gap-3">
															<div className="flex flex-col gap-0.5">
																<span className="flex items-center gap-1.5 text-sm font-semibold text-smile-title">
																	<Icon
																		icon="lucide:stethoscope"
																		width={14}
																		className="text-smile-primary"
																	/>
																	{doctorNames[s.doctor_id]}
																</span>
																<span className="text-xs text-smile-description">
																	{s.clinic?.clinic_name ??
																		t(
																			"schedule.doctors.clinicFallback",
																			"Clinic",
																		)}
																	{s.shift && (
																		<>
																			{" · "}
																			{s.shift.shift_name} ·{" "}
																			{s.shift.start_time?.slice(0, 5)}–
																			{s.shift.end_time?.slice(0, 5)}
																		</>
																	)}
																</span>
																<span
																	className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? "").toLowerCase()] ?? "text-smile-description"}`}
																>
																	{s.status ?? "—"} ·{" "}
																	{t("schedule.doctors.maxLabel", "max")}{" "}
																	{s.max_patients ?? "—"}
																</span>
															</div>
															<div className="flex shrink-0 gap-1.5">
																<Link
																	href={ROUTES.DOCTOR_SCHEDULE_EDIT(
																		s.schedule_id,
																	)}
																	title={t("schedule.doctors.edit", "Edit")}
																	className="rounded-lg border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] p-1.5 text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
																>
																	<Icon icon="lucide:pencil" width={14} />
																</Link>
																<button
																	onClick={() => setTransferFor(s)}
																	title={t(
																		"schedule.doctors.transferShift",
																		"Transfer shift",
																	)}
																	className="rounded-lg border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] p-1.5 text-smile-primary transition hover:border-smile-primary/40"
																>
																	<Icon
																		icon="lucide:arrow-left-right"
																		width={14}
																	/>
																</button>
																<button
																	onClick={() => setChangesFor(s)}
																	title={t(
																		"schedule.doctors.changeHistory",
																		"Change history",
																	)}
																	className="rounded-lg border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] p-1.5 text-smile-description transition hover:border-smile-primary/40 hover:text-smile-primary"
																>
																	<Icon icon="lucide:history" width={14} />
																</button>
																{s.status !== "cancelled" && (
																	<button
																		onClick={() => setCancelTarget(s)}
																		title={t(
																			"schedule.doctors.cancel",
																			"Cancel",
																		)}
																		className="rounded-lg border border-red-400/30 bg-red-400/10 p-1.5 text-red-600 dark:text-red-300 transition hover:bg-red-400/20"
																	>
																		<Icon icon="lucide:x" width={14} />
																	</button>
																)}
															</div>
														</div>
														{s.shift?.start_time && s.shift?.end_time && (
															<ShiftTimeline
																startTime={s.shift.start_time.slice(0, 5)}
																endTime={s.shift.end_time.slice(0, 5)}
																appointments={dayAppointments.map((a) => ({
																	time:
																		a.appointment_time?.slice(0, 5) ?? "00:00",
																	duration_minutes: a.duration_minutes,
																}))}
															/>
														)}
													</div>
												);
											})}
										</div>
									)}
								</>
							)}
						</div>
					</div>
				)}

				<p className="text-xs text-smile-description">
					<Icon
						icon="lucide:bell"
						width={12}
						className="mr-1 inline text-smile-primary"
					/>
					{t(
						"schedule.doctors.notifyHint",
						"Creating, updating or transferring a schedule notifies the affected doctor (see the bell in the top bar).",
					)}
				</p>
			</div>

			{transferFor && (
				<TransferModal
					scheduleId={transferFor.schedule_id}
					fromDoctorId={transferFor.doctor_id}
					onClose={() => setTransferFor(null)}
					onDone={() => {
						setTransferFor(null);
						qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
					}}
				/>
			)}
			{changesFor && (
				<ChangesModal
					scheduleId={changesFor.schedule_id}
					onClose={() => setChangesFor(null)}
				/>
			)}

			<ConfirmDialog
				open={!!cancelTarget}
				title={t(
					"schedule.doctors.confirmCancelTitle",
					"Cancel this schedule?",
				)}
				description={
					cancelTarget
						? `${t("schedule.doctors.confirmCancelDescPrefix", "Cancel")} ${doctorNames[cancelTarget.doctor_id]}${t("schedule.doctors.confirmCancelDescMid", "'s shift on")} ${cancelTarget.work_date}${t("schedule.doctors.confirmCancelDescSuffix", ". The doctor will be notified.")}`
						: ""
				}
				pending={cancel.isPending}
				confirmLabel={t(
					"schedule.doctors.confirmCancelAction",
					"Cancel schedule",
				)}
				cancelLabel={t("schedule.doctors.keepSchedule", "Keep it")}
				onOpenChange={(open) => {
					if (!open) setCancelTarget(null);
				}}
				onConfirm={() => {
					if (!cancelTarget) return;
					cancel.mutate(cancelTarget.schedule_id, {
						onSuccess: () => setCancelTarget(null),
					});
				}}
			/>
		</AppShell>
	);
}
