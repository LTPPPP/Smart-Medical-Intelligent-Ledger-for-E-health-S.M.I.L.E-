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
import { format } from "date-fns";

import { useTranslation } from "@/features/i18n";
import {
	TransferModal,
	ChangesModal,
} from "@/features/schedule/components/ScheduleModals";
import { ShiftTimeline } from "@/features/schedule/components/ShiftTimeline";
import {
	doctorName,
	SCHEDULE_STATUS_STYLE,
	unwrapArr,
} from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Calendar, CalendarDayButton } from "@/shared/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
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
	const qc = useQueryClient();
	const [transferFor, setTransferFor] = useState<Schedule | null>(null);
	const [changesFor, setChangesFor] = useState<Schedule | null>(null);
	const [viewDoctorId, setViewDoctorId] = useState("");
	const [activeDay, setActiveDay] = useState<string | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["doctor-schedules", "list"],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, { params: { limit: 50 } }),
	});
	const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);

	// Browse doctor
	const doctorIds = useMemo(
		() => Array.from(new Set(schedules.map((s) => s.doctor_id))),
		[schedules],
	);
	const doctorProfileQueries = useQueries({
		queries: doctorIds.map((id) => ({
			queryKey: ["user-profile", id],
			queryFn: () =>
				apiClient.get<{ full_name?: string }>(
					API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(id),
				),
			staleTime: 10 * 60 * 1000,
		})),
	});
	const doctorOptions = useMemo(
		() =>
			doctorIds.map((id, i) => ({
				id,
				name:
					(
						doctorProfileQueries[i]?.data as
							| { data?: { full_name?: string } }
							| undefined
					)?.data?.full_name ?? doctorName(id),
			})),
		[doctorIds, doctorProfileQueries],
	);

	const { data: viewSchedulesRes } = useQuery({
		queryKey: ["doctor-schedules", "by-doctor", viewDoctorId],
		queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.BY_DOCTOR(viewDoctorId)),
		enabled: !!viewDoctorId,
	});
	const { data: viewAppointmentsRes } = useQuery({
		queryKey: ["appointments", "by-doctor", viewDoctorId],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(viewDoctorId)),
		enabled: !!viewDoctorId,
	});
	const viewSchedules = useMemo(
		() => unwrapArr<Schedule>(viewSchedulesRes),
		[viewSchedulesRes],
	);
	const viewAppointments = useMemo(
		() => unwrapArr<AppointmentRow>(viewAppointmentsRes),
		[viewAppointmentsRes],
	);
	const viewScheduleDates = useMemo(
		() => new Set(viewSchedules.map((s) => s.work_date)),
		[viewSchedules],
	);
	const ViewScheduleDayButton = useMemo(
		() => makeScheduleDayButton(viewScheduleDates),
		[viewScheduleDates],
	);
	const activeDaySchedules = useMemo(
		() =>
			activeDay ? viewSchedules.filter((s) => s.work_date === activeDay) : [],
		[activeDay, viewSchedules],
	);

	const cancel = useMutation({
		mutationFn: (id: string) =>
			apiClient.post(API_ENDPOINTS.SCHEDULE.CANCEL(id)),
		onSuccess: () => {
			toast.success(t("schedule.doctors.cancelledToast", "Schedule cancelled"));
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
		},
		onError: (e) =>
			toast.apiError(e, t("schedule.doctors.cancelFailedToast", "Failed to cancel")),
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
						<Link
							href={ROUTES.MY_SCHEDULE}
							className="flex items-center gap-2 rounded-full border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-4 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
						>
							<Icon icon="lucide:user-round" width={15} />{" "}
							{t("schedule.doctors.myScheduleLink", "My Schedule")}
						</Link>
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
						className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}
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
				{!isLoading && !isError && schedules.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t("schedule.doctors.empty", "No schedules yet.")}
					</div>
				)}

				{!isLoading && !isError && schedules.length > 0 && (
					<div className={`${cardBase} overflow-x-auto`}>
						<table className="w-full text-left text-sm">
							<thead className="border-b [border-color:var(--surface-panel-border)] text-xs uppercase tracking-wide text-smile-description font-poppins">
								<tr>
									<th className="px-5 py-4">{t("schedule.doctors.colDoctor", "Doctor")}</th>
									<th className="px-5 py-4">{t("schedule.doctors.colClinic", "Clinic")}</th>
									<th className="px-5 py-4">{t("schedule.doctors.colDate", "Date")}</th>
									<th className="px-5 py-4">{t("schedule.doctors.colMax", "Max")}</th>
									<th className="px-5 py-4">{t("schedule.doctors.colStatus", "Status")}</th>
									<th className="px-5 py-4 text-right">
										{t("schedule.doctors.colActions", "Actions")}
									</th>
								</tr>
							</thead>
							<tbody>
								{schedules.map((s) => (
									<tr
										key={s.schedule_id}
										className="border-b [border-color:var(--surface-panel-border)] last:border-0 transition hover:bg-smile-primary-light/30"
									>
										<td className="px-5 py-4 font-medium text-smile-title">
											{doctorName(s.doctor_id)}
										</td>
										<td className="px-5 py-4 text-smile-description">
											{s.clinic?.clinic_name ?? "—"}
										</td>
										<td className="px-5 py-4 text-smile-title">
											{s.work_date}
										</td>
										<td className="px-5 py-4 text-smile-description">
											{s.max_patients ?? "—"}
										</td>
										<td className="px-5 py-4">
											<span
												className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? "").toLowerCase()] ?? "text-smile-description"}`}
											>
												{s.status ?? "—"}
											</span>
										</td>
										<td className="px-5 py-4">
											<div className="flex justify-end gap-1.5">
												<Link
													href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)}
													title={t("schedule.doctors.edit", "Edit")}
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
												>
													<Icon icon="lucide:pencil" width={14} />
												</Link>
												<button
													onClick={() => setTransferFor(s)}
													title={t("schedule.doctors.transferShift", "Transfer shift")}
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-primary transition hover:border-smile-primary/40"
												>
													<Icon icon="lucide:arrow-left-right" width={14} />
												</button>
												<button
													onClick={() => setChangesFor(s)}
													title={t("schedule.doctors.changeHistory", "Change history")}
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-description transition hover:border-smile-primary/40 hover:text-smile-primary"
												>
													<Icon icon="lucide:history" width={14} />
												</button>
												{s.status !== "cancelled" && (
													<button
														onClick={() => {
															if (
																confirm(
																	t("schedule.doctors.confirmCancel", "Cancel this schedule?"),
																)
															)
																cancel.mutate(s.schedule_id);
														}}
														title={t("schedule.doctors.cancel", "Cancel")}
														className="rounded-lg border border-red-400/30 bg-red-400/10 p-1.5 text-red-600 dark:text-red-300 transition hover:bg-red-400/20"
													>
														<Icon icon="lucide:x" width={14} />
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Per-doctor calendar view */}
				<div className={`${cardBase} flex flex-col gap-4 p-6`}>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
							{t("schedule.doctors.doctorCalendarTitle", "Doctor calendar")}
						</h2>
						<select
							value={viewDoctorId}
							onChange={(e) => {
								setViewDoctorId(e.target.value);
								setActiveDay(null);
							}}
							className="h-10 rounded-xl border px-3 text-sm text-smile-title outline-none [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
						>
							<option value="">{t("schedule.doctors.selectDoctor", "Select a doctor…")}</option>
							{doctorOptions.map((d) => (
								<option key={d.id} value={d.id}>
									{d.name}
								</option>
							))}
						</select>
					</div>
					{viewDoctorId ? (
						viewSchedules.length === 0 ? (
							<p className="p-6 text-center text-sm text-smile-description">
								{t(
									"schedule.doctors.noScheduleForDoctor",
									"No schedule registered for this doctor yet.",
								)}
							</p>
						) : (
							<div className="flex flex-col items-center gap-3">
								<Calendar
									components={{ DayButton: ViewScheduleDayButton }}
									onDayClick={(date) => {
										const key = format(date, "yyyy-MM-dd");
										if (viewScheduleDates.has(key)) setActiveDay(key);
									}}
									className="[--cell-size:3rem]"
								/>
								<div className="flex items-center gap-2 text-xs text-smile-description">
									<span
										className="h-1.5 w-1.5 rounded-full"
										style={{ background: TEAL }}
									/>
									{t(
										"schedule.doctors.dayHasShiftHint",
										"day has a scheduled shift — click it for details",
									)}
								</div>
							</div>
						)
					) : (
						<p className="p-6 text-center text-sm text-smile-description">
							{t("schedule.doctors.pickDoctorHint", "Pick a doctor to browse their calendar.")}
						</p>
					)}
				</div>

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

			<Dialog
				open={!!activeDay}
				onOpenChange={(open) => {
					if (!open) setActiveDay(null);
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{activeDay &&
								format(new Date(`${activeDay}T00:00:00`), "EEEE, dd MMM yyyy")}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						{activeDaySchedules.map((s) => {
							const dayAppointments = viewAppointments.filter(
								(a) => a.appointment_date === s.work_date,
							);
							return (
								<div
									key={s.schedule_id}
									className={`${cardBase} flex flex-col gap-3 p-4`}
								>
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-smile-title">
											{s.clinic?.clinic_name ?? t("schedule.doctors.clinicFallback", "Clinic")}
										</span>
										{s.shift && (
											<span className="text-xs text-smile-description">
												{s.shift.shift_name} · {s.shift.start_time?.slice(0, 5)}–
												{s.shift.end_time?.slice(0, 5)}
											</span>
										)}
										<span
											className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? "").toLowerCase()] ?? "text-smile-description"}`}
										>
											{s.status ?? "—"} · {t("schedule.doctors.maxLabel", "max")}{" "}
										{s.max_patients ?? "—"}
										</span>
									</div>
									{s.shift?.start_time && s.shift?.end_time && (
										<ShiftTimeline
											startTime={s.shift.start_time.slice(0, 5)}
											endTime={s.shift.end_time.slice(0, 5)}
											appointments={dayAppointments.map((a) => ({
												time: a.appointment_time?.slice(0, 5) ?? "00:00",
												duration_minutes: a.duration_minutes,
											}))}
										/>
									)}
								</div>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>

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
		</AppShell>
	);
}
