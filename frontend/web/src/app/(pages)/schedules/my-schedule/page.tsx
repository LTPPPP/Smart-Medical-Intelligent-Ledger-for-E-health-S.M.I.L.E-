"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	ScheduleForm,
	type ScheduleFormValues,
} from "@/features/schedule/components/ScheduleForm";
import { ShiftTimeline } from "@/features/schedule/components/ShiftTimeline";
import {
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
import { ROLE, hasAnyRole } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const TEAL = "#2E7EAE";
const cardBase =
	"rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)] backdrop-blur-md";

interface Schedule {
	schedule_id: string;
	doctor_id: string;
	work_date: string;
	shift_id?: string | null;
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

// Schedule Day Dot
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

export default function MySchedulePage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const { t } = useTranslation();
	const doctorId = user?.userId ?? "";
	const doctorLabel =
		user?.fullName ??
		user?.email ??
		(doctorId
			? `${t("appointments.detail.doctorPrefix", "Doctor")} ${doctorId.slice(0, 8)}`
			: t("booking.wizard.signedInDoctorFallback", "Signed-in doctor"));
	const [registerOpen, setRegisterOpen] = useState(false);
	const [activeDay, setActiveDay] = useState<string | null>(null);

	const { data, isLoading, isFetching, isError, refetch } = useQuery({
		queryKey: ["doctor-schedules", "by-doctor", doctorId],
		queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.BY_DOCTOR(doctorId)),
		enabled: !!doctorId,
	});
	const { data: apptData } = useQuery({
		queryKey: ["appointments", "by-doctor", doctorId],
		queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(doctorId)),
		enabled: !!doctorId,
	});
	const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);
	const appointments = useMemo(
		() => unwrapArr<AppointmentRow>(apptData),
		[apptData],
	);
	const upcoming = schedules.filter(
		(s) => s.work_date >= new Date().toISOString().slice(0, 10),
	);
	const scheduleDates = useMemo(
		() => new Set(schedules.map((s) => s.work_date)),
		[schedules],
	);
	const ScheduleDayButton = useMemo(
		() => makeScheduleDayButton(scheduleDates),
		[scheduleDates],
	);
	const activeDaySchedules = useMemo(
		() => (activeDay ? schedules.filter((s) => s.work_date === activeDay) : []),
		[activeDay, schedules],
	);
	const canUpdateSchedule = !hasAnyRole(user?.roles, [ROLE.DOCTOR]);

	const register = useMutation({
		mutationFn: (v: ScheduleFormValues) =>
			apiClient.post(API_ENDPOINTS.SCHEDULE.CREATE, v),
		onSuccess: () => {
			toast.success(
				t(
					"schedule.mySchedule.registeredToast",
					"Personal schedule registered",
				),
			);
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
			setRegisterOpen(false);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"schedule.mySchedule.registerFailedToast",
					"Failed to register schedule",
				),
			),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
							{t("schedule.mySchedule.title", "My Schedule")}
						</h1>
						<p className="text-sm text-smile-description">
							{t(
								"schedule.mySchedule.subtitlePrefix",
								"Personal examination schedule",
							)}{" "}
							· {upcoming.length}{" "}
							{t("schedule.mySchedule.upcomingSuffix", "upcoming")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => refetch()}
							disabled={isFetching}
							title={t("schedule.mySchedule.refresh", "Refresh")}
							className="flex h-10 w-10 items-center justify-center rounded-xl border text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary disabled:opacity-60 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
						>
							<Icon
								icon="lucide:refresh-cw"
								width={16}
								className={isFetching ? "animate-spin" : ""}
							/>
						</button>
						<button
							onClick={() => setRegisterOpen((open) => !open)}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:calendar-plus" width={16} />{" "}
							{t("schedule.mySchedule.registerSchedule", "Register schedule")}
						</button>
					</div>
				</div>

				<div className={`${cardBase} flex items-center gap-3 p-4`}>
					<Icon
						icon="lucide:user-round"
						width={18}
						className="text-smile-primary"
					/>
					<span className="text-sm text-smile-description">
						{t("schedule.mySchedule.viewingLabel", "Viewing:")}
					</span>
					<span className="rounded-lg border px-3 py-2 text-sm text-smile-title [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]">
						{doctorLabel}
					</span>
				</div>

				{registerOpen && (
					<div className={`${cardBase} p-6`}>
						<div className="mb-5 flex items-center justify-between">
							<h3 className="font-poppins text-lg font-semibold text-smile-title">
								{t(
									"schedule.mySchedule.registerPersonalTitle",
									"Register personal schedule",
								)}
							</h3>
							<button
								onClick={() => setRegisterOpen(false)}
								className="text-smile-description transition hover:text-smile-primary"
							>
								<Icon icon="lucide:x" width={18} />
							</button>
						</div>
						<ScheduleForm
							key={doctorId || "no-doctor"}
							mode="create"
							lockDoctor
							doctorLabel={doctorLabel}
							initial={{ doctor_id: doctorId }}
							submitLabel={t("schedule.mySchedule.registerSubmit", "Register")}
							submitting={register.isPending}
							onSubmit={(v) => register.mutate(v)}
							onCancel={() => setRegisterOpen(false)}
						/>
					</div>
				)}

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("schedule.mySchedule.loading", "Loading…")}
					</div>
				)}
				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						{t("schedule.mySchedule.failedToLoad", "Failed to load.")}{" "}
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
						{t(
							"schedule.mySchedule.noScheduleForYouPrefix",
							"No schedule registered for",
						)}{" "}
						{doctorLabel}{" "}
						{t("schedule.mySchedule.noScheduleForYouSuffix", "yet.")}
					</div>
				)}

				{!isLoading && !isError && schedules.length > 0 && (
					<div className={`${cardBase} flex flex-col items-center gap-3 p-6`}>
						<Calendar
							components={{ DayButton: ScheduleDayButton }}
							onDayClick={(date) => {
								const key = format(date, "yyyy-MM-dd");
								if (scheduleDates.has(key)) setActiveDay(key);
							}}
							className="[--cell-size:3rem]"
						/>
						<div className="flex items-center gap-2 text-xs text-smile-description">
							<span
								className="h-1.5 w-1.5 rounded-full"
								style={{ background: TEAL }}
							/>
							{t(
								"schedule.mySchedule.dayHasShiftHint",
								"day has a scheduled shift — click it for details",
							)}
						</div>
					</div>
				)}
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
							const dayAppointments = appointments.filter(
								(a) => a.appointment_date === s.work_date,
							);
							return (
								<div
									key={s.schedule_id}
									className={`${cardBase} flex flex-col gap-3 p-4`}
								>
									<div className="flex items-center justify-between gap-3">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-medium text-smile-title">
												{s.clinic?.clinic_name ??
													t("schedule.mySchedule.clinicFallback", "Clinic")}
											</span>
											{s.shift && (
												<span className="text-xs text-smile-description">
													{s.shift.shift_name} ·{" "}
													{s.shift.start_time?.slice(0, 5)}–
													{s.shift.end_time?.slice(0, 5)}
												</span>
											)}
											<span
												className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? "").toLowerCase()] ?? "text-smile-description"}`}
											>
												{s.status ?? "—"} ·{" "}
												{t("schedule.mySchedule.maxLabel", "max")}{" "}
												{s.max_patients ?? "—"}
											</span>
										</div>
										{canUpdateSchedule && (
											<Link
												href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)}
												className="shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]"
											>
												{t("schedule.mySchedule.update", "Update")}
											</Link>
										)}
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
		</AppShell>
	);
}
