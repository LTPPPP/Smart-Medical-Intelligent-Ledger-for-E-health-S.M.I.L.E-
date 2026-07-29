"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { BookingDatePicker } from "@/features/appointment/components/BookingDateTimeFields";
import { useAuthStore } from "@/features/auth/store/authStore";
import { unwrapArr, unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ENV } from "@/shared/constants/env";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-md";
const inputCls =
	"h-11 w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";
const areaCls =
	"min-h-[6.25rem] w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";

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
	const router = useRouter();
	const currentUser = useAuthStore((s) => s.user);
	const doctorId = currentUser?.userId ?? "";
	const doctorLabel =
		currentUser?.fullName ??
		currentUser?.email ??
		(doctorId ? `Doctor ${doctorId.slice(0, 8)}` : "—");
	const [worklistDate, setWorklistDate] = useState(() => todayLocalDate());

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
	} = useQuery({
		queryKey: ["appointments", "doctor-worklist", doctorId, worklistDate],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.APPOINTMENT.DOCTOR_WORKLIST(doctorId), {
				params: { date: worklistDate },
			}),
		enabled: !!doctorId,
	});

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
		return patient?.full_name ?? `Patient ${id.slice(0, 8)}`;
	};
	const clinicLabel = (id: string) => {
		const clinic = clinics.find((c) => c.clinic_id === id);
		return clinic?.clinic_name ?? `Clinic ${id.slice(0, 8)}`;
	};

	const createSession = useMutation({
		mutationFn: () =>
			apiClient.post(`${ENV.SERVICES.GATEWAY}/examination-sessions`, {
				appointment_id: appointmentId,
				chief_complaint: chiefComplaint.trim() || undefined,
				status: "in_progress",
			}),
		onSuccess: (res) => {
			toast.success("Examination session created");
			const created = unwrapOne<Session>(res);
			if (created?.session_id)
				router.push(`/examinations/${created.session_id}`);
			else router.push("/examinations");
		},
		onError: (e) => toast.apiError(e, "Failed to create session"),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!doctorId) {
			setError("Please sign in as a doctor before creating a session.");
			return;
		}
		if (!appointmentId) {
			setError("Please select a checked-in appointment.");
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
					<Icon icon="lucide:arrow-left" width={16} /> Back to examinations
				</button>

				<div>
					<h1 className="font-poppins text-[1.75rem] font-bold tracking-[-0.6px] text-smile-primary-dark">
						New examination session
					</h1>
					<p className="text-sm text-smile-description">
						Start a clinical examination for a patient.
					</p>
				</div>

				<form
					onSubmit={submit}
					className={`${cardBase} flex flex-col gap-5 p-6`}
				>
					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
							<Icon icon="lucide:alert-circle" width={15} /> {error}
						</div>
					)}

					<Field label="Work date">
						<BookingDatePicker
							value={worklistDate}
							onChange={setWorklistDate}
						/>
					</Field>

					<Field label="Checked-in appointment">
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
									? "Loading worklist…"
									: "Select a checked-in appointment…"}
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
							<span className="text-xs text-red-300">
								Cannot load the doctor worklist. Please sign in again or refresh
								after the gateway is ready.
							</span>
						)}
						{!appointmentsLoading &&
							!appointmentsError &&
							checkedInAppointments.length === 0 && (
								<span className="text-xs text-smile-description">
									No checked-in appointment found for {worklistDate}. Ask
									reception to check in an appointment first.
								</span>
							)}
						{!appointmentsLoading &&
							!appointmentsError &&
							checkedInAppointments.length > 0 && (
								<span className="text-xs text-smile-primary">
									{checkedInAppointments.length} checked-in appointment
									{checkedInAppointments.length > 1 ? "s" : ""} ready for
									examination.
								</span>
							)}
					</Field>

					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<Field label="Clinic">
							<input
								className={inputCls}
								value={clinicId ? clinicLabel(clinicId) : "—"}
								readOnly
							/>
						</Field>
						<Field label="Doctor">
							<input className={inputCls} value={doctorLabel} readOnly />
						</Field>
					</div>

					<Field label="Patient">
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
							{selectedAppointment.appointment_date ?? "Today"}
							{selectedAppointment.appointment_time
								? ` · ${selectedAppointment.appointment_time}`
								: ""}
							<span className="ml-2 font-semibold capitalize text-smile-primary">
								{selectedAppointment.status?.replace(/_/g, " ") ?? "checked in"}
							</span>
						</div>
					)}

					<Field label="Chief complaint / notes">
						<textarea
							className={areaCls}
							value={chiefComplaint}
							placeholder="Reason for visit…"
							onChange={(e) => setChiefComplaint(e.target.value)}
						/>
					</Field>

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => router.push("/examinations")}
							className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={createSession.isPending}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
						>
							{createSession.isPending && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							Create session
						</button>
					</div>
				</form>
			</div>
		</AppShell>
	);
}
