"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import {
	BookingDatePicker,
	BookingTimePicker,
} from "@/features/appointment/components/BookingDateTimeFields";
import { useAuthStore } from "@/features/auth/store/authStore";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { ENV } from "@/shared/constants/env";
import { resolveDashboardKind } from "@/shared/constants/nav";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

type Variant = "facility" | "specialty" | "doctor" | "outside";

const METHODS: { id: Variant; label: string; icon: string; desc: string }[] = [
	{
		id: "facility",
		label: "At Facility",
		icon: "lucide:building-2",
		desc: "Book a slot with a doctor at a clinic",
	},
	{
		id: "specialty",
		label: "By Specialty",
		icon: "lucide:stethoscope",
		desc: "Let the clinic assign a specialist",
	},
	{
		id: "doctor",
		label: "By Doctor",
		icon: "lucide:user-round",
		desc: "Choose a specific doctor",
	},
	{
		id: "outside",
		label: "Outside Hours",
		icon: "lucide:moon",
		desc: "Request an after-hours appointment",
	},
];

interface Patient {
	patient_id: string;
	full_name: string;
	patient_code: string;
}
interface Clinic {
	clinic_id: string;
	clinic_name: string;
}
interface Specialty {
	specialty_id: string;
	specialty_name: string;
}
interface Service {
	service_id: string;
	service_name: string;
	required_room_type?: string;
}
interface DoctorScheduleRow {
	doctor_id: string;
	work_date: string;
	room_id: string | null;
	room?: { room_type?: string } | null;
}

interface FormState {
	patient_id: string;
	clinic_id: string;
	doctor_id: string;
	specialty_id: string;
	service_id: string;
	date: string;
	time: string;
	chief_complaint: string;
	notes: string;
}

const EMPTY: FormState = {
	patient_id: "",
	clinic_id: "",
	doctor_id: "",
	specialty_id: "",
	service_id: "",
	date: "",
	time: "",
	chief_complaint: "",
	notes: "",
};

const inputCls =
	"h-11 w-full rounded-xl border px-4 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

function Field({
	label,
	required,
	children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
				{required && <span className="ml-1 text-smile-primary">*</span>}
			</span>
			{children}
		</label>
	);
}

// Steps differ slightly per method, but we use a fixed 4-step skeleton:
// 1 Method · 2 Patient & Clinic · 3 Provider & Schedule · 4 Details & Review
const STEPS = [
	"Method",
	"Patient & Clinic",
	"Provider & Schedule",
	"Review",
] as const;

export function BookingWizard() {
	const router = useRouter();
	const { user } = useAuthStore();
	const actorId = user?.userId ?? "";
	const isDoctor = resolveDashboardKind(user?.roles) === "doctor";
	const currentDoctorLabel =
		user?.fullName ??
		user?.email ??
		(actorId ? `Doctor ${actorId.slice(0, 8)}` : "Signed-in doctor");
	// A PATIENT is forbidden from reading the staff-only /patients directory (by design — see
	// patients.controller.ts), so they can only ever book for themselves via /patients/me.
	const isPatient = resolveDashboardKind(user?.roles) === "patient";

	const [step, setStep] = useState(0);
	const [variant, setVariant] = useState<Variant>("facility");
	const [form, setForm] = useState<FormState>(EMPTY);
	const [error, setError] = useState("");

	const set = (k: keyof FormState, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));

	const { data: patientsRes } = useQuery({
		queryKey: ["patients", "list"],
		queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
		enabled: !isPatient,
	});
	const { data: myPatientRes } = useQuery({
		queryKey: ["patients", "me"],
		queryFn: () =>
			apiClient.get<Patient | null>(`${ENV.SERVICES.GATEWAY}/patients/me`),
		enabled: isPatient,
	});
	const { data: clinicsRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const { data: specsRes } = useQuery({
		queryKey: ["specialties", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.SPECIALTY.LIST),
	});
	const { data: servicesRes } = useQuery({
		queryKey: ["services", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.SERVICE.LIST),
	});
	// Doctors don't have a dedicated list endpoint (cross-service, no picker-ready
	// route) — derive candidates from who has a schedule at the chosen clinic, then
	// resolve each doctor_id to a display name via the unguarded user-profiles route.
	const { data: doctorSchedulesRes } = useQuery({
		queryKey: ["doctor-schedules", "by-clinic", form.clinic_id],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, {
				params: { clinic_id: form.clinic_id, limit: 50 },
			}),
		enabled: !isDoctor && variant !== "specialty" && !!form.clinic_id,
	});

	const patients = useMemo(
		() => unwrapArr<Patient>(patientsRes),
		[patientsRes],
	);
	const myPatient =
		(myPatientRes as { data?: Patient | null } | undefined)?.data ?? null;
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
	const specialties = useMemo(() => unwrapArr<Specialty>(specsRes), [specsRes]);
	const services = useMemo(
		() => unwrapArr<Service>(servicesRes),
		[servicesRes],
	);
	const clinicDoctorIds = useMemo(() => {
		const rows = unwrapArr<DoctorScheduleRow>(doctorSchedulesRes);
		return Array.from(new Set(rows.map((r) => r.doctor_id).filter(Boolean)));
	}, [doctorSchedulesRes]);
	const doctorProfileQueries = useQueries({
		queries: clinicDoctorIds.map((id) => ({
			queryKey: ["user-profile", id],
			queryFn: () =>
				apiClient.get<{ full_name?: string }>(
					API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(id),
				),
			staleTime: 10 * 60 * 1000,
		})),
	});
	const clinicDoctors = useMemo(
		() =>
			clinicDoctorIds.map((id, i) => ({
				doctor_id: id,
				full_name:
					(
						doctorProfileQueries[i]?.data as
							| { data?: { full_name?: string } }
							| undefined
					)?.data?.full_name || `Doctor ${id.slice(0, 8)}`,
			})),
		[clinicDoctorIds, doctorProfileQueries],
	);
	const selectedPatientId = isPatient
		? (myPatient?.patient_id ?? "")
		: form.patient_id;
	const selectedDoctorId = isDoctor ? actorId : form.doctor_id;
	const selectedDoctorLabel = selectedDoctorId
		? selectedDoctorId === actorId
			? currentDoctorLabel
			: (clinicDoctors.find((d) => d.doctor_id === selectedDoctorId)
					?.full_name ?? `Doctor ${selectedDoctorId.slice(0, 8)}`)
		: undefined;

	// "By Doctor" booking (POST /appointments/by-doctor) requires the exact room_id
	// from the doctor's own schedule for that date, and rejects a service whose
	// required_room_type doesn't match that room — see appointments.service.ts
	// optionClaimsFromDoctorDto / assertDoctorScheduleOption.
	const matchedDoctorSchedule = useMemo(() => {
		if (variant !== "doctor" || !selectedDoctorId || !form.date)
			return undefined;
		return unwrapArr<DoctorScheduleRow>(doctorSchedulesRes).find(
			(s) => s.doctor_id === selectedDoctorId && s.work_date === form.date,
		);
	}, [variant, selectedDoctorId, form.date, doctorSchedulesRes]);
	const doctorSlotRoomType = matchedDoctorSchedule?.room?.room_type;
	const servicesForSlot = useMemo(
		() =>
			doctorSlotRoomType
				? services.filter((s) => s.required_room_type === doctorSlotRoomType)
				: services,
		[services, doctorSlotRoomType],
	);

	const nameOf = {
		patient: isPatient
			? (myPatient?.full_name ?? user?.fullName)
			: patients.find((p) => p.patient_id === form.patient_id)?.full_name,
		clinic: clinics.find((c) => c.clinic_id === form.clinic_id)?.clinic_name,
		specialty: specialties.find((s) => s.specialty_id === form.specialty_id)
			?.specialty_name,
		service: services.find((s) => s.service_id === form.service_id)
			?.service_name,
		doctor: selectedDoctorLabel,
	};

	const createMut = useMutation({
		mutationFn: ({
			url,
			body,
		}: { url: string; body: Record<string, unknown> }) =>
			apiClient.post(url, body),
		onSuccess: () => {
			toast.success("Appointment booked");
			router.push(ROUTES.APPOINTMENTS);
		},
		onError: (e) => toast.apiError(e, "Failed to book appointment"),
	});

	// ── per-step validation ──
	const validateStep = (s: number): string => {
		if (s === 1) {
			if (!selectedPatientId) return "Please select a patient.";
			if (!form.clinic_id) return "Please select a clinic.";
		}
		if (s === 2) {
			if (variant === "specialty") {
				if (!form.specialty_id) return "Please select a specialty.";
			} else {
				if (!selectedDoctorId) return "Please select a doctor.";
				if (!form.date) return "Please pick a date.";
				if (!form.time) return "Please pick a time.";
				if (variant === "doctor") {
					if (!matchedDoctorSchedule)
						return "This doctor has no schedule at this clinic on the selected date — pick another date.";
					if (!form.service_id) return "Please select a service.";
				}
			}
		}
		return "";
	};

	const next = () => {
		const msg = validateStep(step);
		if (msg) {
			setError(msg);
			return;
		}
		setError("");
		setStep((s) => Math.min(s + 1, STEPS.length - 1));
	};
	const back = () => {
		setError("");
		setStep((s) => Math.max(s - 1, 0));
	};

	const submit = () => {
		// re-validate the data-bearing steps
		for (const s of [1, 2]) {
			const msg = validateStep(s);
			if (msg) {
				setError(msg);
				setStep(s);
				return;
			}
		}

		let url = "";
		let body: Record<string, unknown> = {};

		if (variant === "facility") {
			url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC;
			body = {
				patient_id: selectedPatientId,
				doctor_id: selectedDoctorId,
				clinic_id: form.clinic_id,
				appointment_date: form.date,
				appointment_time: form.time,
				appointment_type: "consultation",
				created_by: actorId,
				...(form.service_id ? { service_id: form.service_id } : {}),
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
				...(form.notes ? { notes: form.notes } : {}),
			};
		} else if (variant === "specialty") {
			url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY;
			body = {
				specialty_id: form.specialty_id,
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				created_by: actorId,
				...(form.date ? { preferred_date: form.date } : {}),
				...(form.time ? { preferred_time: form.time } : {}),
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
			};
		} else {
			url =
				variant === "doctor"
					? API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR
					: API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS;
			body = {
				doctor_id: selectedDoctorId,
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				appointment_date: form.date,
				appointment_time: form.time,
				created_by: actorId,
				...(variant === "outside"
					? {
							outside_hours_reason:
								form.chief_complaint || "After-hours request",
						}
					: {}),
				// "By Doctor" bookings must carry the exact room_id from the doctor's own
				// schedule for that date — the backend rejects any other value.
				...(variant === "doctor" && matchedDoctorSchedule?.room_id
					? { room_id: matchedDoctorSchedule.room_id }
					: {}),
				...(form.service_id ? { service_id: form.service_id } : {}),
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
				...(form.notes ? { notes: form.notes } : {}),
			};
		}
		setError("");
		createMut.mutate({ url, body });
	};

	return (
		<div
			className="flex flex-col gap-6 rounded-[20px] border p-6 backdrop-blur-xl"
			style={{
				background: "var(--surface-card-bg)",
				borderColor: "var(--surface-card-border)",
				boxShadow: "var(--surface-card-shadow)",
			}}
		>
			{/* Progress */}
			<div className="flex items-center">
				{STEPS.map((label, i) => {
					const done = i < step;
					const active = i === step;
					return (
						<div
							key={label}
							className="flex flex-1 items-center last:flex-none"
						>
							<div className="flex flex-col items-center gap-1.5">
								<div
									className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-poppins text-sm font-semibold transition-all ${
										done
											? "border-smile-primary bg-smile-primary text-white"
											: active
												? "border-smile-primary text-smile-primary"
												: "border-smile-primary/20 text-smile-description"
									}`}
								>
									{done ? <Icon icon="lucide:check" width={16} /> : i + 1}
								</div>
								<span
									className={`hidden font-inter text-[11px] font-semibold sm:block ${active || done ? "text-smile-primary" : "text-smile-description"}`}
								>
									{label}
								</span>
							</div>
							{i < STEPS.length - 1 && (
								<div
									className="mx-2 h-0.5 flex-1 rounded-full"
									style={{
										background:
											i < step
												? "var(--color-smile-primary)"
												: "var(--surface-panel-border)",
									}}
								/>
							)}
						</div>
					);
				})}
			</div>

			{variant === "outside" && step >= 1 && (
				<div className="flex items-start gap-2 rounded-xl border border-smile-primary/30 bg-smile-primary/5 px-4 py-3 font-inter text-sm text-smile-title">
					<Icon
						icon="lucide:info"
						width={16}
						className="mt-0.5 shrink-0 text-smile-primary"
					/>
					<span>
						After hours: this slot falls outside the clinic&apos;s normal
						business hours and may require special staffing approval.
					</span>
				</div>
			)}

			{error && (
				<div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 font-inter text-sm text-red-500 dark:text-red-300">
					<Icon icon="lucide:alert-circle" width={15} /> {error}
				</div>
			)}

			<AnimatePresence mode="wait">
				<motion.div
					key={step}
					initial={{ opacity: 0, x: 16 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -16 }}
					transition={{ duration: 0.2 }}
				>
					{/* STEP 0 — method */}
					{step === 0 && (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{METHODS.map((m) => {
								const active = variant === m.id;
								return (
									<button
										key={m.id}
										type="button"
										onClick={() => {
											setVariant(m.id);
											setError("");
										}}
										className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
											active
												? "border-smile-primary bg-smile-primary-light/50 shadow-[0_4px_16px_rgba(65,126,170,0.15)]"
												: "hover:border-smile-primary/40"
										}`}
										style={
											!active
												? {
														background: "var(--surface-panel-bg)",
														borderColor: "var(--surface-panel-border)",
													}
												: undefined
										}
									>
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-smile-primary text-white" : "bg-smile-primary-light text-smile-primary"}`}
										>
											<Icon icon={m.icon} width={20} />
										</div>
										<div>
											<p className="font-poppins text-sm font-semibold text-smile-primary-dark">
												{m.label}
											</p>
											<p className="font-inter text-xs text-smile-description">
												{m.desc}
											</p>
										</div>
										{active && (
											<Icon
												icon="lucide:check-circle"
												width={18}
												className="ml-auto shrink-0 text-smile-primary"
											/>
										)}
									</button>
								);
							})}
						</div>
					)}

					{/* STEP 1 — patient & clinic */}
					{step === 1 && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label="Patient" required>
								{isPatient ? (
									<input
										className={`${inputCls} cursor-not-allowed opacity-80`}
										value={nameOf.patient ?? "You"}
										readOnly
									/>
								) : (
									<select
										className={inputCls}
										value={form.patient_id}
										onChange={(e) => set("patient_id", e.target.value)}
									>
										<option value="">Select patient…</option>
										{patients.map((p) => (
											<option key={p.patient_id} value={p.patient_id}>
												{p.full_name} ({p.patient_code})
											</option>
										))}
									</select>
								)}
							</Field>
							<Field label="Clinic" required>
								<select
									className={inputCls}
									value={form.clinic_id}
									onChange={(e) => set("clinic_id", e.target.value)}
								>
									<option value="">Select clinic…</option>
									{clinics.map((c) => (
										<option key={c.clinic_id} value={c.clinic_id}>
											{c.clinic_name}
										</option>
									))}
								</select>
							</Field>
						</div>
					)}

					{/* STEP 2 — provider & schedule */}
					{step === 2 && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{variant === "specialty" ? (
								<Field label="Specialty" required>
									<select
										className={inputCls}
										value={form.specialty_id}
										onChange={(e) => set("specialty_id", e.target.value)}
									>
										<option value="">Select specialty…</option>
										{specialties.map((s) => (
											<option key={s.specialty_id} value={s.specialty_id}>
												{s.specialty_name}
											</option>
										))}
									</select>
								</Field>
							) : (
								<Field label="Doctor" required>
									{isDoctor ? (
										<input
											className={`${inputCls} cursor-not-allowed opacity-80`}
											value={currentDoctorLabel}
											readOnly
										/>
									) : (
										<select
											className={inputCls}
											value={form.doctor_id}
											onChange={(e) => set("doctor_id", e.target.value)}
										>
											<option value="">
												{clinicDoctors.length
													? "Select doctor…"
													: "No doctors scheduled at this clinic"}
											</option>
											{clinicDoctors.map((d) => (
												<option key={d.doctor_id} value={d.doctor_id}>
													{d.full_name}
												</option>
											))}
										</select>
									)}
								</Field>
							)}
							{variant !== "specialty" && (
								<Field
									label={
										variant === "doctor" ? "Service" : "Service (optional)"
									}
									required={variant === "doctor"}
								>
									<select
										className={inputCls}
										value={form.service_id}
										onChange={(e) => set("service_id", e.target.value)}
									>
										<option value="">
											{variant === "doctor"
												? "Select service…"
												: "No specific service"}
										</option>
										{(variant === "doctor" ? servicesForSlot : services).map(
											(s) => (
												<option key={s.service_id} value={s.service_id}>
													{s.service_name}
												</option>
											),
										)}
									</select>
									{variant === "doctor" && form.date && !doctorSlotRoomType && (
										<p className="mt-1 text-xs text-smile-description">
											Pick a date to narrow this list to what this doctor&apos;s
											room supports.
										</p>
									)}
									{variant === "doctor" &&
										doctorSlotRoomType &&
										servicesForSlot.length === 0 && (
											<p className="mt-1 text-xs text-red-400">
												No services available for this doctor&apos;s room type
												on this date.
											</p>
										)}
								</Field>
							)}
							<Field
								label={variant === "specialty" ? "Preferred date" : "Date"}
								required={variant !== "specialty"}
							>
								<BookingDatePicker
									value={form.date}
									onChange={(v) => set("date", v)}
									minDate={new Date()}
								/>
							</Field>
							<Field
								label={variant === "specialty" ? "Preferred time" : "Time"}
								required={variant !== "specialty"}
							>
								<BookingTimePicker
									value={form.time}
									onChange={(v) => set("time", v)}
								/>
							</Field>
						</div>
					)}

					{/* STEP 3 — details & review */}
					{step === 3 && (
						<div className="flex flex-col gap-5">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field
									label={
										variant === "outside"
											? "Reason (after-hours)"
											: "Chief complaint"
									}
								>
									<input
										className={inputCls}
										value={form.chief_complaint}
										placeholder="Reason for visit"
										onChange={(e) => set("chief_complaint", e.target.value)}
									/>
								</Field>
								{variant !== "specialty" && (
									<Field label="Notes">
										<input
											className={inputCls}
											value={form.notes}
											placeholder="Additional notes"
											onChange={(e) => set("notes", e.target.value)}
										/>
									</Field>
								)}
							</div>

							{/* Summary */}
							<div
								className="rounded-2xl border p-5"
								style={{
									background: "var(--surface-panel-bg)",
									borderColor: "var(--surface-panel-border)",
								}}
							>
								<p className="mb-3 font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">
									Review
								</p>
								<dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
									{[
										["Method", METHODS.find((m) => m.id === variant)?.label],
										["Patient", nameOf.patient],
										["Clinic", nameOf.clinic],
										...(variant === "specialty"
											? [["Specialty", nameOf.specialty]]
											: [["Doctor", nameOf.doctor]]),
										...(variant !== "specialty" && form.service_id
											? [["Service", nameOf.service]]
											: []),
										["Date", form.date || "—"],
										["Time", form.time || "—"],
										...(form.chief_complaint
											? [["Reason", form.chief_complaint]]
											: []),
									].map(([k, v]) => (
										<div
											key={k as string}
											className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0 [border-color:var(--surface-panel-border)]"
										>
											<dt className="font-inter text-xs text-smile-description">
												{k}
											</dt>
											<dd className="truncate font-inter text-sm font-medium text-smile-title">
												{v || "—"}
											</dd>
										</div>
									))}
								</dl>
							</div>
						</div>
					)}
				</motion.div>
			</AnimatePresence>

			{/* Nav buttons */}
			<div className="flex items-center justify-between pt-1">
				<button
					type="button"
					onClick={back}
					disabled={step === 0}
					className="flex items-center gap-2 rounded-full border px-5 py-2.5 font-inter text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
					style={{
						background: "var(--surface-panel-bg)",
						borderColor: "var(--surface-panel-border)",
					}}
				>
					<Icon icon="lucide:arrow-left" width={16} /> Back
				</button>

				{step < STEPS.length - 1 ? (
					<button
						type="button"
						onClick={next}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 font-inter text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
					>
						Continue <Icon icon="lucide:arrow-right" width={16} />
					</button>
				) : (
					<button
						type="button"
						onClick={submit}
						disabled={createMut.isPending}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 font-inter text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark disabled:opacity-60"
					>
						{createMut.isPending && (
							<Icon icon="line-md:loading-twotone-loop" width={16} />
						)}
						Confirm Booking
					</button>
				)}
			</div>
		</div>
	);
}

export default BookingWizard;
