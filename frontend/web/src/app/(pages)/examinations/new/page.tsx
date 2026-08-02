"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { unwrapArr, unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Calendar, CalendarDayButton } from "@/shared/components/ui/calendar";
import { InlineFeedback } from "@/shared/components/ui/InlineFeedback";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ENV } from "@/shared/constants/env";
import { toast } from "@/shared/lib/toast";

const TEAL = "#2E7EAE";

// Mark Appointment Days
function makeAppointmentDayButton(appointmentDates: Set<string>) {
	return function AppointmentDayButton(
		props: React.ComponentProps<typeof CalendarDayButton>,
	) {
		const hasAppointment = appointmentDates.has(
			format(props.day.date, "yyyy-MM-dd"),
		);
		return (
			<div className="relative h-full w-full">
				<CalendarDayButton {...props} />
				{hasAppointment && (
					<span
						className="pointer-events-none absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
						style={{ background: TEAL }}
					/>
				)}
			</div>
		);
	};
}

const cardBase =
	"rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-md";
const inputCls =
	"h-11 w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";
const areaCls =
	"min-h-[100px] w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";

interface Patient {
	patient_id: string;
	full_name?: string;
	patient_code?: string;
}
interface Clinic {
	clinic_id: string;
	clinic_name?: string;
}
interface Session {
	session_id: string;
}
interface Appointment {
	appointment_id: string;
	appointment_code?: string;
	patient_id: string;
	doctor_id: string;
	clinic_id: string;
	appointment_date?: string;
	appointment_time?: string;
	chief_complaint?: string | null;
	status?: string;
}

const todayLocalDate = () => {
	const now = new Date();
	const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 10);
};

function Field({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
			</span>
			{children}
		</label>
	);
}

export default function NewExaminationPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const currentUser = useAuthStore((s) => s.user);
	const doctorId = currentUser?.userId ?? "";
	const doctorLabel =
		currentUser?.fullName ??
		currentUser?.email ??
		(doctorId
			? `${t("examination.new.doctorPrefix", "Doctor")} ${doctorId.slice(0, 8)}`
			: "—");
	const [worklistDate, setWorklistDate] = useState(() => todayLocalDate());
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	const [patientId, setPatientId] = useState("");
	const [clinicId, setClinicId] = useState("");
	const [appointmentId, setAppointmentId] = useState("");
	const [chiefComplaint, setChiefComplaint] = useState("");
	const [error, setError] = useState("");

	const { data: patRes } = useQuery({
		queryKey: ["patients", "list"],
		queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
	});
	const { data: clinicRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/clinics`),
	});
	const {
		data: apptRes,
		isError: appointmentsError,
		isLoading: appointmentsLoading,
		refetch: refetchAppointments,
	} = useQuery({
		queryKey: ["appointments", "doctor-worklist", doctorId, worklistDate],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.APPOINTMENT.DOCTOR_WORKLIST(doctorId), {
				params: { date: worklistDate },
			}),
		enabled: !!doctorId,
	});

	// Fetch Appointment Dates
	const { data: allApptRes } = useQuery({
		queryKey: ["appointments", "by-doctor", doctorId],
		queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(doctorId)),
		enabled: !!doctorId,
	});
	const checkedInDates = useMemo(
		() =>
			new Set(
				unwrapArr<Appointment>(allApptRes)
					.filter((a) => a.status === "checked_in" && a.appointment_date)
					.map((a) => a.appointment_date as string),
			),
		[allApptRes],
	);
	const AppointmentDayButton = useMemo(
		() => makeAppointmentDayButton(checkedInDates),
		[checkedInDates],
	);

	const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicRes), [clinicRes]);
	const checkedInAppointments = useMemo(
		() =>
			unwrapArr<Appointment>(apptRes).filter(
				(appointment) => appointment.status === "checked_in",
			),
		[apptRes],
	);
	const selectedAppointment = checkedInAppointments.find(
		(appointment) => appointment.appointment_id === appointmentId,
	);
	const patientLabel = (id: string) => {
		const patient = patients.find((p) => p.patient_id === id);
		return (
			patient?.full_name ??
			`${t("examination.new.patientPrefix", "Patient")} ${id.slice(0, 8)}`
		);
	};
	const clinicLabel = (id: string) => {
		const clinic = clinics.find((c) => c.clinic_id === id);
		return (
			clinic?.clinic_name ??
			`${t("examination.new.clinicPrefix", "Clinic")} ${id.slice(0, 8)}`
		);
	};

	const createSession = useMutation({
		mutationFn: () =>
			apiClient.post(`${ENV.SERVICES.GATEWAY}/examination-sessions`, {
				appointment_id: appointmentId,
				chief_complaint: chiefComplaint.trim() || undefined,
				status: "in_progress",
			}),
		onSuccess: (res) => {
			toast.success(
				t("examination.new.toast.created", "Examination session created"),
			);
			const created = unwrapOne<Session>(res);
			if (created?.session_id)
				router.push(`/examinations/${created.session_id}`);
			else router.push("/examinations");
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("examination.new.toast.createError", "Failed to create session"),
			),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!doctorId) {
			setError(
				t(
					"examination.new.errors.signInRequired",
					"Please sign in as a doctor before creating a session.",
				),
			);
			return;
		}
		if (!appointmentId) {
			setError(
				t(
					"examination.new.errors.appointmentRequired",
					"Please select a checked-in appointment.",
				),
			);
			return;
		}
		setError("");
		createSession.mutate();
	};

	const selectAppointment = (nextAppointmentId: string) => {
		setAppointmentId(nextAppointmentId);
		const appointment = checkedInAppointments.find(
			(item) => item.appointment_id === nextAppointmentId,
		);
		setPatientId(appointment?.patient_id ?? "");
		setClinicId(appointment?.clinic_id ?? "");
		setChiefComplaint(appointment?.chief_complaint ?? "");
	};

	useEffect(() => {
		if (appointmentsLoading || appointmentsError) return;

		const currentAppointment = checkedInAppointments.find(
			(item) => item.appointment_id === appointmentId,
		);
		if (currentAppointment) return;

		const firstAppointment = checkedInAppointments[0];
		if (!firstAppointment) {
			setAppointmentId("");
			setPatientId("");
			setClinicId("");
			setChiefComplaint("");
			return;
		}

		setAppointmentId(firstAppointment.appointment_id);
		setPatientId(firstAppointment.patient_id);
		setClinicId(firstAppointment.clinic_id);
		setChiefComplaint(firstAppointment.chief_complaint ?? "");
	}, [
		appointmentId,
		appointmentsError,
		appointmentsLoading,
		checkedInAppointments,
	]);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push("/examinations")}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} />{" "}
					{t("examination.new.backToExaminations", "Back to examinations")}
				</button>

				<div>
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
						{t("examination.new.title", "New examination session")}
					</h1>
					<p className="text-sm text-smile-description">
						{t(
							"examination.new.description",
							"Start a clinical examination for a patient.",
						)}
					</p>
				</div>

				<form
					onSubmit={submit}
					className={`${cardBase} flex flex-col gap-5 p-6`}
				>
					{error && (
						<InlineFeedback tone="error" className="py-2.5">
							{error}
						</InlineFeedback>
					)}

					<Field label={t("examination.new.fields.workDate", "Work date")}>
						<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
							<PopoverTrigger
								className={`${inputCls} flex items-center gap-2.5 text-left`}
							>
								<Icon
									icon="lucide:calendar-days"
									width={17}
									className="shrink-0 text-smile-primary/70"
								/>
								{worklistDate}
								{checkedInDates.has(worklistDate) && (
									<span
										className="ml-auto h-1.5 w-1.5 rounded-full"
										style={{ background: TEAL }}
									/>
								)}
							</PopoverTrigger>
							<PopoverContent align="start" className="w-auto p-0">
								<Calendar
									mode="single"
									selected={new Date(`${worklistDate}T00:00:00`)}
									components={{ DayButton: AppointmentDayButton }}
									onSelect={(date) => {
										if (!date) return;
										setWorklistDate(format(date, "yyyy-MM-dd"));
										setDatePickerOpen(false);
									}}
									className="[--cell-size:2.5rem]"
								/>
							</PopoverContent>
						</Popover>
						<p className="mt-1 flex items-center gap-1.5 text-xs text-smile-description">
							<span
								className="h-1.5 w-1.5 rounded-full"
								style={{ background: TEAL }}
							/>
							{t(
								"examination.new.dayHasCheckedIn",
								"day has a checked-in appointment waiting",
							)}
						</p>
					</Field>

					<Field
						label={t(
							"examination.new.checkedInAppointmentLabel",
							"Checked-in appointment",
						)}
					>
						<select
							className={inputCls}
							value={appointmentId}
							onChange={(e) => selectAppointment(e.target.value)}
							disabled={
								appointmentsLoading ||
								appointmentsError ||
								checkedInAppointments.length === 0
							}
						>
							<option
								value=""
								className="[background:var(--surface-input-bg)] text-smile-title"
							>
								{appointmentsLoading
									? t("examination.new.loadingWorklist", "Loading worklist…")
									: t(
											"examination.new.selectCheckedInPlaceholder",
											"Select a checked-in appointment…",
										)}
							</option>
							{checkedInAppointments.map((appointment) => (
								<option
									key={appointment.appointment_id}
									value={appointment.appointment_id}
									className="[background:var(--surface-input-bg)] text-smile-title"
								>
									{appointment.appointment_code ??
										appointment.appointment_id.slice(0, 8)}
									{" · "}
									{patientLabel(appointment.patient_id)}
									{appointment.appointment_time
										? ` · ${appointment.appointment_time}`
										: ""}
								</option>
							))}
						</select>
						{appointmentsError && (
							<InlineFeedback
								tone="error"
								className="mt-1 py-2.5 text-xs"
								actionLabel={t("common.retry", "Retry")}
								onAction={() => void refetchAppointments()}
							>
								{t(
									"examination.new.worklistLoadError",
									"Cannot load the doctor worklist. Please sign in again or refresh after the gateway is ready.",
								)}
							</InlineFeedback>
						)}
						{!appointmentsLoading &&
							!appointmentsError &&
							checkedInAppointments.length === 0 && (
								<span className="text-xs text-smile-description">
									{t(
										"examination.new.noCheckedInFoundPrefix",
										"No checked-in appointment found for",
									)}{" "}
									{worklistDate}.{" "}
									{t(
										"examination.new.noCheckedInFoundSuffix",
										"Ask reception to check in an appointment first.",
									)}
								</span>
							)}
						{!appointmentsLoading &&
							!appointmentsError &&
							checkedInAppointments.length > 0 && (
								<span className="text-xs text-smile-primary">
									{checkedInAppointments.length}{" "}
									{t(
										"examination.new.checkedInReadyLabel",
										"checked-in appointment(s) ready for examination.",
									)}
								</span>
							)}
					</Field>

					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<Field label={t("examination.new.clinicLabel", "Clinic")}>
							<input
								className={inputCls}
								value={clinicId ? clinicLabel(clinicId) : "—"}
								readOnly
							/>
						</Field>
						<Field label={t("examination.new.doctorLabel", "Doctor")}>
							<input className={inputCls} value={doctorLabel} readOnly />
						</Field>
					</div>

					<Field label={t("examination.new.patientLabel", "Patient")}>
						<input
							className={inputCls}
							value={patientId ? patientLabel(patientId) : "—"}
							readOnly
						/>
					</Field>

					{selectedAppointment && (
						<div className="rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] px-4 py-3 text-xs text-smile-description">
							<Icon
								icon="lucide:calendar-check"
								width={14}
								className="mb-0.5 mr-1 inline"
							/>
							{selectedAppointment.appointment_date ??
								t("examination.new.todayFallback", "Today")}
							{selectedAppointment.appointment_time
								? ` · ${selectedAppointment.appointment_time}`
								: ""}
							<span className="ml-2 font-semibold capitalize text-smile-primary">
								{selectedAppointment.status?.replace(/_/g, " ") ??
									t("examination.new.checkedInFallback", "checked in")}
							</span>
						</div>
					)}

					<Field
						label={t(
							"examination.new.chiefComplaintLabel",
							"Chief complaint / notes",
						)}
					>
						<textarea
							className={areaCls}
							value={chiefComplaint}
							placeholder={t(
								"examination.new.reasonForVisitPlaceholder",
								"Reason for visit…",
							)}
							onChange={(e) => setChiefComplaint(e.target.value)}
						/>
					</Field>

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => router.push("/examinations")}
							className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)]"
						>
							{t("common.cancel", "Cancel")}
						</button>
						<button
							type="submit"
							disabled={createSession.isPending}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
						>
							{createSession.isPending && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							{t("examination.new.createSession", "Create session")}
						</button>
					</div>
				</form>
			</div>
		</AppShell>
	);
}
