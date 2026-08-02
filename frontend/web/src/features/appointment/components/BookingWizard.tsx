"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

import {
	BookingDatePicker,
	BookingTimePicker,
} from "@/features/appointment/components/BookingDateTimeFields";
import type { AppointmentAvailabilitySlot } from "@/features/appointment/types/appointment.type";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { PHONE_REGEX } from "@/shared/constants/common";
import { ENV } from "@/shared/constants/env";
import { resolveDashboardKind } from "@/shared/constants/nav";
import { ROUTES } from "@/shared/constants/routes";
import { StyledSelect } from "@/shared/components/ui/StyledSelect";
import { toast } from "@/shared/lib/toast";

type Variant = "facility" | "specialty" | "doctor" | "outside";

// Translation Key Labels
const METHODS: { id: Variant; label: string; icon: string; desc: string }[] = [
	{
		id: "facility",
		label: "booking.wizard.methods.facilityLabel",
		icon: "lucide:building-2",
		desc: "booking.wizard.methods.facilityDesc",
	},
	{
		id: "specialty",
		label: "booking.wizard.methods.specialtyLabel",
		icon: "lucide:stethoscope",
		desc: "booking.wizard.methods.specialtyDesc",
	},
	{
		id: "doctor",
		label: "booking.wizard.methods.doctorLabel",
		icon: "lucide:user-round",
		desc: "booking.wizard.methods.doctorDesc",
	},
	{
		id: "outside",
		label: "booking.wizard.methods.outsideLabel",
		icon: "lucide:moon",
		desc: "booking.wizard.methods.outsideDesc",
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
	address?: string;
	district?: string;
	city?: string;
	logo_url?: string | null;
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
	clinic_id: string;
	work_date: string;
	room_id: string | null;
	room?: { room_type?: string } | null;
}

export function buildExactDoctorScheduleParams(
	doctorId: string,
	clinicId: string,
	workDate: string,
) {
	return {
		doctor_id: doctorId,
		clinic_id: clinicId,
		work_date: workDate,
		limit: 2,
	};
}
interface DoctorSpecialtyRow {
	doctor_id: string;
	specialty_id: string;
	is_primary?: boolean;
	certified_date?: string | null;
	specialty?: { specialty_name?: string } | null;
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

function ClinicPicker({
	clinics,
	search,
	onSearchChange,
	selected,
	onSelect,
}: {
	clinics: Clinic[];
	search: string;
	onSearchChange: (v: string) => void;
	selected: string;
	onSelect: (id: string) => void;
}) {
	const { t } = useTranslation();
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return clinics;
		return clinics.filter((c) =>
			[c.clinic_name, c.address, c.district, c.city]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(q),
		);
	}, [clinics, search]);

	return (
		<div className="flex flex-col gap-3">
			<div className="relative">
				<Icon
					icon="lucide:search"
					width={16}
					className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smile-description"
				/>
				<input
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={t(
						"booking.wizard.clinicPicker.searchPlaceholder",
						"Search clinic by name or area…",
					)}
					className={`${inputCls} pl-10`}
				/>
			</div>

			{filtered.length === 0 ? (
				<p
					className="rounded-xl border border-dashed p-4 text-center font-inter text-sm text-smile-description"
					style={{ borderColor: "var(--surface-panel-border)" }}
				>
					{clinics.length === 0
						? t(
								"booking.wizard.clinicPicker.noClinics",
								"No clinics available.",
							)
						: `${t("booking.wizard.clinicPicker.noMatchPrefix", "No clinics match")} "${search}".`}
				</p>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{filtered.map((c) => {
						const active = selected === c.clinic_id;
						const location = [c.address, c.district, c.city]
							.filter(Boolean)
							.join(", ");
						return (
							<button
								key={c.clinic_id}
								type="button"
								onClick={() => onSelect(c.clinic_id)}
								className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
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
								<span className="min-w-0 flex-1">
									<span className="block truncate font-poppins text-sm font-semibold text-smile-title">
										{c.clinic_name}
									</span>
									{location && (
										<span className="block truncate font-inter text-xs text-smile-description">
											{location}
										</span>
									)}
								</span>
								{c.logo_url ? (
									<span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
										<Image
											src={c.logo_url}
											alt={c.clinic_name}
											fill
											sizes="56px"
											className="object-cover"
											unoptimized
										/>
									</span>
								) : (
									<span
										className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
											active
												? "bg-smile-primary text-white"
												: "bg-smile-primary-light text-smile-primary"
										}`}
									>
										<Icon icon="lucide:building-2" width={20} />
									</span>
								)}
								{active && (
									<Icon
										icon="lucide:check-circle"
										width={18}
										className="shrink-0 text-smile-primary"
									/>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

function DoctorPicker({
	doctors,
	selected,
	onSelect,
}: {
	doctors: {
		doctor_id: string;
		full_name: string;
		avatar_url?: string | null;
		specialty?: string;
		yearsExperience?: number;
	}[];
	selected: string;
	onSelect: (id: string) => void;
}) {
	const { t } = useTranslation();
	if (doctors.length === 0) {
		return (
			<p
				className="rounded-xl border border-dashed p-4 text-center font-inter text-sm text-smile-description"
				style={{ borderColor: "var(--surface-panel-border)" }}
			>
				{t(
					"booking.wizard.doctorPicker.empty",
					"No doctors scheduled at this clinic yet.",
				)}
			</p>
		);
	}
	return (
		<div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
			{doctors.map((d) => {
				const active = selected === d.doctor_id;
				const initials =
					d.full_name
						.split(" ")
						.map((p) => p[0])
						.slice(0, 2)
						.join("")
						.toUpperCase() || "DR";
				return (
					<button
						key={d.doctor_id}
						type="button"
						onClick={() => onSelect(d.doctor_id)}
						className={`relative flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
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
						{active && (
							<Icon
								icon="lucide:check-circle"
								width={18}
								className="absolute right-2 top-2 shrink-0 text-smile-primary"
							/>
						)}
						{d.avatar_url ? (
							<span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
								<Image
									src={d.avatar_url}
									alt={d.full_name}
									fill
									sizes="64px"
									className="object-cover"
									loading="eager"
									unoptimized
								/>
							</span>
						) : (
							<span
								className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-poppins text-base font-semibold ${
									active
										? "bg-smile-primary text-white"
										: "bg-smile-primary-light text-smile-primary"
								}`}
							>
								{initials}
							</span>
						)}
						<span className="line-clamp-2 font-poppins text-xs font-semibold leading-tight text-smile-title">
							{t("booking.wizard.drPrefix", "Dr.")} {d.full_name}
						</span>
						{d.specialty && (
							<span className="line-clamp-1 rounded-full bg-smile-primary-light px-2 py-0.5 font-inter text-[10px] font-semibold text-smile-primary">
								{d.specialty}
							</span>
						)}
						{typeof d.yearsExperience === "number" && (
							<span className="flex items-center gap-1 font-inter text-[10px] text-smile-description">
								<Icon icon="lucide:badge-check" width={11} />
								{d.yearsExperience > 0
									? `${d.yearsExperience}+ ${t("booking.wizard.doctorPicker.yearsExperienceSuffix", "yrs experience")}`
									: t(
											"booking.wizard.doctorPicker.newlyCertified",
											"Newly certified",
										)}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

interface AvailabilityDateGroup {
	date: string;
	doctors: { doctor_id: string; slots: AppointmentAvailabilitySlot[] }[];
}

// Per-Doctor Availability
export function DoctorSlotPicker({
	dates,
	activeDate,
	onActiveDateChange,
	onSelectSlot,
	selectedDate,
	selectedTime,
	isLoading = false,
	isError = false,
	onRetry,
}: {
	dates: AvailabilityDateGroup[];
	activeDate: string;
	onActiveDateChange: (date: string) => void;
	onSelectSlot: (date: string, slot: AppointmentAvailabilitySlot) => void;
	selectedDate: string;
	selectedTime: string;
	isLoading?: boolean;
	isError?: boolean;
	onRetry?: () => void;
}) {
	const { t } = useTranslation();
	const availableLabel = t("booking.wizard.slotPicker.available", "Available");
	const unavailableLabel = t(
		"booking.wizard.slotPicker.unavailable",
		"Unavailable",
	);

	if (isLoading) {
		return (
			<output
				aria-live="polite"
				className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-4 font-inter text-sm text-smile-description"
			>
				<Icon icon="lucide:loader-circle" className="size-4 animate-spin" />
				{t("booking.wizard.slotPicker.loading", "Loading available slots…")}
			</output>
		);
	}
	if (isError) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center font-inter text-sm text-destructive"
			>
				<span className="flex items-center gap-2">
					<Icon icon="lucide:triangle-alert" className="size-4" />
					{t(
						"booking.wizard.slotPicker.error",
						"Could not load available slots.",
					)}
				</span>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="rounded-lg border border-destructive/40 bg-white px-3 py-1.5 font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
					>
						{t("common.retry", "Retry")}
					</button>
				)}
			</div>
		);
	}
	if (dates.length === 0) {
		return (
			<p
				className="rounded-xl border border-dashed p-4 text-center font-inter text-sm text-smile-description"
				style={{ borderColor: "var(--surface-panel-border)" }}
			>
				{t(
					"booking.wizard.slotPicker.empty",
					"No upcoming schedule found for this doctor at this clinic.",
				)}
			</p>
		);
	}
	const group = dates.find((d) => d.date === activeDate) ?? dates[0];
	const rawSlots = group.doctors[0]?.slots ?? [];
	// Filter Past Slots
	const isToday = group.date === format(new Date(), "yyyy-MM-dd");
	const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
	const slots = isToday
		? rawSlots.filter((s) => {
				const [h, m] = s.start_time.split(":").map(Number);
				return h * 60 + m > nowMinutes;
			})
		: rawSlots;

	return (
		<div className="flex flex-col gap-3">
			<div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
				{dates.map((d) => {
					const active = d.date === group.date;
					const available = d.doctors.some((doctor) =>
						doctor.slots.some(
							(slot) => slot.status === "available" && !!slot.option_token,
						),
					);
					const statusLabel = available ? availableLabel : unavailableLabel;
					const dateLabel = format(parseISO(d.date), "EEE dd/MM");
					return (
						<button
							key={d.date}
							type="button"
							onClick={() => onActiveDateChange(d.date)}
							aria-label={`${dateLabel} — ${statusLabel}`}
							aria-pressed={active}
							className={`shrink-0 snap-start rounded-xl border px-3 py-2 text-center font-inter text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-smile-primary focus-visible:ring-offset-2 ${
								available
									? "border-success/40 bg-success/10 text-success hover:bg-success/20"
									: "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
							} ${active ? "ring-2 ring-smile-primary ring-offset-2" : ""}`}
						>
							<span>{dateLabel}</span>
							<span className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium">
								<Icon
									icon={available ? "lucide:circle-check" : "lucide:circle-x"}
									className="size-3"
								/>
								{statusLabel}
							</span>
						</button>
					);
				})}
			</div>
			{slots.length === 0 ? (
				<p
					className="rounded-xl border border-dashed p-4 text-center font-inter text-sm text-smile-description"
					style={{ borderColor: "var(--surface-panel-border)" }}
				>
					{t(
						"booking.wizard.slotPicker.noSlotsThisDay",
						"No slots on this day.",
					)}
				</p>
			) : (
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{slots.map((s) => {
						const isSelected =
							selectedDate === group.date && selectedTime === s.start_time;
						const available = s.status === "available" && !!s.option_token;
						const statusLabel = available ? availableLabel : unavailableLabel;
						return (
							<button
								key={s.start_time}
								type="button"
								disabled={!available}
								onClick={() => onSelectSlot(group.date, s)}
								aria-label={`${s.start_time} — ${statusLabel}`}
								aria-pressed={isSelected}
								className={`flex flex-col items-center rounded-lg border px-2 py-2 font-inter text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-smile-primary focus-visible:ring-offset-2 ${
									available
										? "border-success/40 bg-success/10 text-success hover:bg-success/20"
										: "cursor-not-allowed border-destructive/40 bg-destructive/10 text-destructive disabled:opacity-100"
								} ${isSelected ? "ring-2 ring-smile-primary ring-offset-2" : ""}`}
							>
								<span>{s.start_time}</span>
								<span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium">
									<Icon
										icon={available ? "lucide:circle-check" : "lucide:circle-x"}
										className="size-3"
									/>
									{statusLabel}
								</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

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

// Step Order By Method
const STEPS_BY_CLINIC_FIRST = [
	"booking.wizard.steps.method",
	"booking.wizard.steps.clinic",
	"booking.wizard.steps.providerSchedule",
	"booking.wizard.steps.patientReview",
] as const;
const STEPS_BY_SPECIALTY_FIRST = [
	"booking.wizard.steps.method",
	"booking.wizard.steps.specialty",
	"booking.wizard.steps.clinic",
	"booking.wizard.steps.patientReview",
] as const;

export function BookingWizard() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const actorId = user?.userId ?? "";
	const isDoctor = resolveDashboardKind(user?.roles) === "doctor";
	const currentDoctorLabel =
		user?.fullName ??
		user?.email ??
		(actorId
			? `${t("booking.wizard.doctorPrefix", "Doctor")} ${actorId.slice(0, 8)}`
			: t("booking.wizard.signedInDoctorFallback", "Signed-in doctor"));
	// Patient Directory Restricted
	const isPatient = resolveDashboardKind(user?.roles) === "patient";

	const [step, setStep] = useState(0);
	const [variant, setVariant] = useState<Variant>("facility");
	const [form, setForm] = useState<FormState>(EMPTY);
	const [error, setError] = useState("");
	const [clinicSearch, setClinicSearch] = useState("");
	const [patientSearch, setPatientSearch] = useState("");
	const [myPatientName, setMyPatientName] = useState(
		() => user?.fullName ?? "",
	);
	const [myPatientPhone, setMyPatientPhone] = useState("");
	// Any Role Can Also Book For Themselves, Not Just Patient Accounts.
	const [bookForSelf, setBookForSelf] = useState(false);
	const bookingForSelf = isPatient || bookForSelf;
	// Availability Token Slot
	const [optionToken, setOptionToken] = useState("");
	const [activeSlotDate, setActiveSlotDate] = useState("");
	// Relabel Shared Step
	const steps: readonly string[] = (
		variant === "specialty"
			? STEPS_BY_SPECIALTY_FIRST
			: STEPS_BY_CLINIC_FIRST.map((label, i) => {
					if (i !== 2) return label;
					if (variant === "outside")
						return "booking.wizard.steps.specialtySchedule";
					if (variant === "facility") return "booking.wizard.steps.schedule";
					return label;
				})
	).map((key) => t(key));

	const set = (k: keyof FormState, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));

	const { data: patientsRes } = useQuery({
		queryKey: ["patients", "list"],
		queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
		enabled: !isPatient,
	});
	const {
		data: myPatientRes,
		isLoading: isMyPatientLoading,
		isFetched: isMyPatientFetched,
	} = useQuery({
		queryKey: ["patients", "me"],
		queryFn: () => apiClient.get<Patient | null>(API_ENDPOINTS.PATIENT.ME),
		enabled: bookingForSelf,
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
	// Derive Doctor Candidates
	const { data: doctorSchedulesRes } = useQuery({
		queryKey: ["doctor-schedules", "by-clinic", form.clinic_id],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, {
				params: { clinic_id: form.clinic_id, limit: 50 },
			}),
		enabled: !isDoctor && variant === "doctor" && !!form.clinic_id,
	});
	// Reverse Specialty Lookup
	const { data: specialtyDoctorsRes } = useQuery({
		queryKey: ["doctor-specialties", "by-specialty", form.specialty_id],
		queryFn: () =>
			apiClient.get(
				API_ENDPOINTS.DOCTOR_SPECIALTY.BY_SPECIALTY(form.specialty_id),
			),
		enabled: variant === "specialty" && !!form.specialty_id,
	});
	const specialtyDoctorIds = useMemo(() => {
		const rows = unwrapArr<DoctorSpecialtyRow>(specialtyDoctorsRes);
		return Array.from(new Set(rows.map((r) => r.doctor_id).filter(Boolean)));
	}, [specialtyDoctorsRes]);
	const specialtyScheduleQueries = useQueries({
		queries: specialtyDoctorIds.map((id) => ({
			queryKey: ["doctor-schedules", "by-doctor", id],
			queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.BY_DOCTOR(id)),
			staleTime: 5 * 60 * 1000,
		})),
	});
	const specialtyClinicIds = useMemo(() => {
		const ids = new Set<string>();
		for (const q of specialtyScheduleQueries) {
			for (const row of unwrapArr<DoctorScheduleRow>(q.data)) {
				if (row.clinic_id) ids.add(row.clinic_id);
			}
		}
		return ids;
	}, [specialtyScheduleQueries]);

	const patients = useMemo(
		() => unwrapArr<Patient>(patientsRes),
		[patientsRes],
	);
	// Search patients
	const filteredPatients = useMemo(() => {
		const q = patientSearch.trim().toLowerCase();
		if (!q) return patients;
		return patients.filter(
			(p) =>
				p.patient_id === form.patient_id ||
				p.full_name.toLowerCase().includes(q) ||
				p.patient_code.toLowerCase().includes(q),
		);
	}, [patients, patientSearch, form.patient_id]);
	const myPatient =
		(myPatientRes as { data?: Patient | null } | undefined)?.data ?? null;
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
	const clinicsForSpecialty = useMemo(
		() => clinics.filter((c) => specialtyClinicIds.has(c.clinic_id)),
		[clinics, specialtyClinicIds],
	);
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
				apiClient.get<{ full_name?: string; avatar_url?: string | null }>(
					API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(id),
				),
			staleTime: 10 * 60 * 1000,
		})),
	});
	// Richer Doctor Cards
	const doctorSpecialtyListQueries = useQueries({
		queries: clinicDoctorIds.map((id) => ({
			queryKey: ["doctor-specialties", "by-doctor", id],
			queryFn: () =>
				apiClient.get(API_ENDPOINTS.DOCTOR_SPECIALTY.BY_DOCTOR(id)),
			staleTime: 10 * 60 * 1000,
		})),
	});
	const clinicDoctors = useMemo(
		() =>
			clinicDoctorIds.map((id, i) => {
				const profile = (
					doctorProfileQueries[i]?.data as
						| { data?: { full_name?: string; avatar_url?: string | null } }
						| undefined
				)?.data;
				const specialtyRows = unwrapArr<DoctorSpecialtyRow>(
					doctorSpecialtyListQueries[i]?.data,
				);
				const primarySpecialty =
					specialtyRows.find((s) => s.is_primary) ?? specialtyRows[0];
				const certifiedYear = primarySpecialty?.certified_date
					? new Date(primarySpecialty.certified_date).getFullYear()
					: undefined;
				const yearsExperience = certifiedYear
					? Math.max(0, new Date().getFullYear() - certifiedYear)
					: undefined;
				return {
					doctor_id: id,
					full_name:
						profile?.full_name ||
						`${t("booking.wizard.doctorPrefix", "Doctor")} ${id.slice(0, 8)}`,
					avatar_url: profile?.avatar_url ?? null,
					specialty: primarySpecialty?.specialty?.specialty_name,
					yearsExperience,
				};
			}),
		[clinicDoctorIds, doctorProfileQueries, doctorSpecialtyListQueries, t],
	);
	const selectedPatientId = bookingForSelf
		? (myPatient?.patient_id ?? "")
		: form.patient_id;
	const selectedDoctorId = isDoctor ? actorId : form.doctor_id;
	const selectedDoctorLabel = selectedDoctorId
		? selectedDoctorId === actorId
			? currentDoctorLabel
			: (clinicDoctors.find((d) => d.doctor_id === selectedDoctorId)
					?.full_name ??
				`${t("booking.wizard.doctorPrefix", "Doctor")} ${selectedDoctorId.slice(0, 8)}`)
		: undefined;

	// Fetch Doctor Availability
	const isDoctorSlotFlow = variant === "doctor" && bookingForSelf && !isDoctor;
	const {
		data: exactDoctorScheduleRes,
		isLoading: isLoadingExactDoctorSchedule,
		isError: isExactDoctorScheduleError,
	} = useQuery({
		queryKey: [
			"doctor-schedules",
			"exact",
			selectedDoctorId,
			form.clinic_id,
			form.date,
		],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, {
				params: buildExactDoctorScheduleParams(
					selectedDoctorId,
					form.clinic_id,
					form.date,
				),
			}),
		enabled:
			variant === "doctor" &&
			!isDoctorSlotFlow &&
			!!selectedDoctorId &&
			!!form.clinic_id &&
			!!form.date,
	});
	const {
		data: availabilityRes,
		isLoading: isLoadingAvailability,
		isError: isAvailabilityError,
		refetch: refetchAvailability,
	} = useQuery({
		queryKey: [
			"appointments",
			"availability",
			selectedPatientId,
			form.doctor_id,
			form.clinic_id,
			form.service_id,
		],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.APPOINTMENT.AVAILABILITY, {
				params: {
					patient_id: selectedPatientId,
					service_id: form.service_id,
					doctor_id: form.doctor_id,
					clinic_id: form.clinic_id,
					date_from: format(new Date(), "yyyy-MM-dd"),
					date_to: format(addDays(new Date(), 13), "yyyy-MM-dd"),
				},
			}),
		enabled:
			isDoctorSlotFlow &&
			!!selectedPatientId &&
			!!form.doctor_id &&
			!!form.service_id,
	});
	const availabilityDates = useMemo(() => {
		const payload = (
			availabilityRes as
				| { data?: { dates?: AvailabilityDateGroup[] } }
				| undefined
		)?.data;
		return payload?.dates ?? [];
	}, [availabilityRes]);
	const selectSlot = (dateStr: string, slot: AppointmentAvailabilitySlot) => {
		if (slot.status !== "available" || !slot.option_token) return;
		setOptionToken(slot.option_token);
		set("date", dateStr);
		set("time", slot.start_time);
	};

	// Match Doctor Room
	const matchedDoctorSchedule = useMemo(() => {
		if (variant !== "doctor" || !selectedDoctorId || !form.date)
			return undefined;
		return unwrapArr<DoctorScheduleRow>(exactDoctorScheduleRes).find(
			(s) => s.doctor_id === selectedDoctorId && s.work_date === form.date,
		);
	}, [variant, selectedDoctorId, form.date, exactDoctorScheduleRes]);
	const doctorSlotRoomType = matchedDoctorSchedule?.room?.room_type;
	const servicesForSlot = useMemo(
		() =>
			doctorSlotRoomType
				? services.filter((s) => s.required_room_type === doctorSlotRoomType)
				: services,
		[services, doctorSlotRoomType],
	);

	const nameOf = {
		patient: bookingForSelf
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
			toast.success(t("booking.wizard.toast.booked", "Appointment booked"));
			// Refresh Appointments List
			queryClient.invalidateQueries({ queryKey: ["appointments", "list"] });
			router.push(ROUTES.APPOINTMENTS);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("booking.wizard.toast.bookFailed", "Failed to book appointment"),
			),
	});

	// Auto-Create Patient Profile
	const createMyPatientMut = useMutation({
		mutationFn: (payload: { full_name: string; phone: string }) =>
			apiClient.post(API_ENDPOINTS.PATIENT.CREATE_MINE, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["patients", "me"] });
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"booking.wizard.toast.patientProfileCreateFailed",
					"Failed to create patient profile",
				),
			),
	});

	// Per-Step Validation
	const validateStep = (s: number): string => {
		if (s === 1) {
			if (variant === "specialty") {
				if (!form.specialty_id)
					return t(
						"booking.wizard.validation.selectSpecialty",
						"Please select a specialty.",
					);
			} else {
				if (!form.clinic_id)
					return t(
						"booking.wizard.validation.selectClinic",
						"Please select a clinic.",
					);
			}
		}
		if (s === 2) {
			if (variant === "specialty") {
				if (!form.clinic_id)
					return t(
						"booking.wizard.validation.selectClinic",
						"Please select a clinic.",
					);
				if (!form.date)
					return t("booking.wizard.validation.pickDate", "Please pick a date.");
				if (!form.time)
					return t("booking.wizard.validation.pickTime", "Please pick a time.");
			} else if (variant === "outside") {
				if (!form.specialty_id)
					return t(
						"booking.wizard.validation.selectSpecialty",
						"Please select a specialty.",
					);
				if (!form.date)
					return t("booking.wizard.validation.pickDate", "Please pick a date.");
				if (!form.time)
					return t("booking.wizard.validation.pickTime", "Please pick a time.");
			} else if (variant === "facility") {
				if (!form.date)
					return t("booking.wizard.validation.pickDate", "Please pick a date.");
				if (!form.time)
					return t("booking.wizard.validation.pickTime", "Please pick a time.");
			} else {
				if (!selectedDoctorId)
					return t(
						"booking.wizard.validation.selectDoctor",
						"Please select a doctor.",
					);
				if (!form.service_id)
					return t(
						"booking.wizard.validation.selectService",
						"Please select a service.",
					);
				if (isDoctorSlotFlow) {
					if (!optionToken)
						return t(
							"booking.wizard.validation.pickSlot",
							"Please pick an available time slot.",
						);
				} else {
					if (!form.date)
						return t(
							"booking.wizard.validation.pickDate",
							"Please pick a date.",
						);
					if (!form.time)
						return t(
							"booking.wizard.validation.pickTime",
							"Please pick a time.",
						);
					if (isLoadingExactDoctorSchedule)
						return t(
							"booking.wizard.validation.checkingSchedule",
							"Checking the doctor's schedule…",
						);
					if (isExactDoctorScheduleError)
						return t(
							"booking.wizard.validation.scheduleCheckFailed",
							"Could not verify this schedule. Please try again.",
						);
					if (!matchedDoctorSchedule)
						return t(
							"booking.wizard.validation.noScheduleThatDate",
							"This doctor has no schedule at this clinic on the selected date — pick another date.",
						);
				}
			}
		}
		if (s === 3) {
			if (!selectedPatientId)
				return t(
					"booking.wizard.validation.selectPatient",
					"Please select a patient.",
				);
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
		setStep((s) => Math.min(s + 1, steps.length - 1));
	};
	const back = () => {
		setError("");
		setStep((s) => Math.max(s - 1, 0));
	};

	const submit = () => {
		// Re-validate Steps
		for (const s of [1, 2, 3]) {
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
			// Auto-Assign Doctor
			url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC;
			body = {
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				appointment_date: form.date,
				appointment_time: form.time,
				created_by: actorId,
				...(form.service_id ? { service_id: form.service_id } : {}),
				...(form.notes ? { notes: form.notes } : {}),
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
			};
		} else if (variant === "specialty") {
			url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY;
			body = {
				specialty_id: form.specialty_id,
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				created_by: actorId,
				preferred_date: form.date,
				preferred_time: form.time,
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
			};
		} else if (variant === "outside") {
			// Auto-Assign Doctor
			url = API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS;
			body = {
				specialty_id: form.specialty_id,
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				appointment_date: form.date,
				appointment_time: form.time,
				created_by: actorId,
				outside_hours_reason: form.notes || "After-hours request",
				...(form.service_id ? { service_id: form.service_id } : {}),
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
			};
		} else if (isDoctorSlotFlow) {
			// Use Availability Token
			url = API_ENDPOINTS.APPOINTMENT.BOOK_OPTION;
			body = {
				patient_id: selectedPatientId,
				option_token: optionToken,
				created_by: actorId,
				...(form.chief_complaint
					? { chief_complaint: form.chief_complaint }
					: {}),
				...(form.notes ? { notes: form.notes } : {}),
			};
		} else {
			url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR;
			body = {
				doctor_id: selectedDoctorId,
				patient_id: selectedPatientId,
				clinic_id: form.clinic_id,
				appointment_date: form.date,
				appointment_time: form.time,
				created_by: actorId,
				// Require Exact Room
				...(matchedDoctorSchedule?.room_id
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
				{steps.map((label, i) => {
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
							{i < steps.length - 1 && (
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

			{(variant === "outside" || variant === "facility") && step >= 1 && (
				<div className="flex items-start gap-2 rounded-xl border border-smile-primary/30 bg-smile-primary/5 px-4 py-3 font-inter text-sm text-smile-title">
					<Icon
						icon="lucide:info"
						width={16}
						className="mt-0.5 shrink-0 text-smile-primary"
					/>
					<span>
						{variant === "outside"
							? t(
									"booking.wizard.banners.outsideHours",
									"After hours: this slot falls outside the clinic's normal business hours and may require special staffing approval.",
								)
							: t(
									"booking.wizard.banners.facilityAutoAssign",
									"A specific doctor isn't chosen yet — reception will assign your doctor, room, and service when you check in at the clinic.",
								)}
					</span>
				</div>
			)}

			{!isPatient && step >= 1 && (
				<div className="flex flex-wrap items-center gap-3">
					<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
						{t("booking.wizard.step3.bookingForLabel", "Booking for")}
					</span>
					<div className="inline-flex w-fit rounded-xl border p-1 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]">
						<button
							type="button"
							onClick={() => setBookForSelf(false)}
							className={`rounded-lg px-4 py-2 font-inter text-sm font-medium transition ${
								!bookForSelf
									? "bg-smile-primary text-white shadow-sm"
									: "text-smile-description hover:text-smile-title"
							}`}
						>
							{t("booking.wizard.step3.bookingForOther", "Another patient")}
						</button>
						<button
							type="button"
							onClick={() => setBookForSelf(true)}
							className={`rounded-lg px-4 py-2 font-inter text-sm font-medium transition ${
								bookForSelf
									? "bg-smile-primary text-white shadow-sm"
									: "text-smile-description hover:text-smile-title"
							}`}
						>
							{t("booking.wizard.step3.bookingForSelf", "Myself")}
						</button>
					</div>
				</div>
			)}

			{error && (
				<div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 font-inter text-sm text-destructive">
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
												{t(m.label)}
											</p>
											<p className="font-inter text-xs text-smile-description">
												{t(m.desc)}
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

					{/* STEP 1 — specialty (By Specialty) or clinic (everyone else) */}
					{step === 1 &&
						(variant === "specialty" ? (
							<div className="flex flex-col gap-1.5">
								<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
									{t("booking.wizard.step1.specialtyLabel", "Specialty")}
									<span className="ml-1 text-smile-primary">*</span>
								</span>
								<StyledSelect
									value={form.specialty_id}
									onChange={(v) => set("specialty_id", v)}
								>
									<option value="">
										{t(
											"booking.wizard.step1.selectSpecialty",
											"Select specialty…",
										)}
									</option>
									{specialties.map((s) => (
										<option key={s.specialty_id} value={s.specialty_id}>
											{s.specialty_name}
										</option>
									))}
								</StyledSelect>
							</div>
						) : (
							<div className="flex flex-col gap-1.5">
								<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
									{t("booking.wizard.step1.clinicLabel", "Clinic")}
									<span className="ml-1 text-smile-primary">*</span>
								</span>
								<ClinicPicker
									clinics={clinics}
									search={clinicSearch}
									onSearchChange={setClinicSearch}
									selected={form.clinic_id}
									onSelect={(id) => set("clinic_id", id)}
								/>
							</div>
						))}

					{/* STEP 2 — clinic (By Specialty) or provider & schedule (everyone else) */}
					{step === 2 && isDoctorSlotFlow && (
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
									{t(
										"booking.wizard.step2.chooseYourDoctor",
										"Choose your doctor",
									)}
									<span className="ml-1 text-smile-primary">*</span>
								</span>
								<DoctorPicker
									doctors={clinicDoctors}
									selected={form.doctor_id}
									onSelect={(id) => {
										set("doctor_id", id);
										setOptionToken("");
									}}
								/>
							</div>
							<Field
								label={t("booking.wizard.step2.service", "Service")}
								required
							>
								<StyledSelect
									value={form.service_id}
									onChange={(v) => {
										set("service_id", v);
										setOptionToken("");
									}}
								>
									<option value="">
										{t("booking.wizard.step2.selectService", "Select service…")}
									</option>
									{services.map((s) => (
										<option key={s.service_id} value={s.service_id}>
											{s.service_name}
										</option>
									))}
								</StyledSelect>
							</Field>
							{form.doctor_id && form.service_id && (
								<div className="flex flex-col gap-1.5">
									<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
										{t(
											"booking.wizard.step2.availableSlots",
											"Available slots",
										)}
										<span className="ml-1 text-smile-primary">*</span>
									</span>
									<DoctorSlotPicker
										dates={availabilityDates}
										activeDate={
											activeSlotDate || (availabilityDates[0]?.date ?? "")
										}
										onActiveDateChange={setActiveSlotDate}
										onSelectSlot={selectSlot}
										selectedDate={form.date}
										selectedTime={form.time}
										isLoading={isLoadingAvailability}
										isError={isAvailabilityError}
										onRetry={() => void refetchAvailability()}
									/>
								</div>
							)}
						</div>
					)}
					{step === 2 && !isDoctorSlotFlow && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{variant === "specialty" ? (
								<div className="flex flex-col gap-1.5 sm:col-span-2">
									<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
										{t("booking.wizard.step2.clinicLabel", "Clinic")}
										<span className="ml-1 text-smile-primary">*</span>
									</span>
									<ClinicPicker
										clinics={clinicsForSpecialty}
										search={clinicSearch}
										onSearchChange={setClinicSearch}
										selected={form.clinic_id}
										onSelect={(id) => set("clinic_id", id)}
									/>
								</div>
							) : variant === "doctor" ? (
								isDoctor ? (
									<Field
										label={t("booking.wizard.step2.doctorLabel", "Doctor")}
										required
									>
										<input
											className={`${inputCls} cursor-not-allowed opacity-80`}
											value={currentDoctorLabel}
											readOnly
										/>
									</Field>
								) : (
									<div className="flex flex-col gap-1.5 sm:col-span-2">
										<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
											{t(
												"booking.wizard.step2.chooseYourDoctor",
												"Choose your doctor",
											)}
											<span className="ml-1 text-smile-primary">*</span>
										</span>
										<DoctorPicker
											doctors={clinicDoctors}
											selected={form.doctor_id}
											onSelect={(id) => set("doctor_id", id)}
										/>
									</div>
								)
							) : variant === "outside" ? (
								<Field
									label={t("booking.wizard.step2.specialtyLabel", "Specialty")}
									required
								>
									<StyledSelect
										value={form.specialty_id}
										onChange={(v) => set("specialty_id", v)}
									>
										<option value="">
											{t(
												"booking.wizard.step2.selectSpecialty",
												"Select specialty…",
											)}
										</option>
										{specialties.map((s) => (
											<option key={s.specialty_id} value={s.specialty_id}>
												{s.specialty_name}
											</option>
										))}
									</StyledSelect>
								</Field>
							) : null}
							{variant !== "specialty" && (
								<Field
									label={
										variant === "doctor"
											? t("booking.wizard.step2.service", "Service")
											: t(
													"booking.wizard.step2.serviceOptional",
													"Service (optional)",
												)
									}
									required={variant === "doctor"}
								>
									<StyledSelect
										value={form.service_id}
										onChange={(v) => set("service_id", v)}
									>
										<option value="">
											{variant === "doctor"
												? t(
														"booking.wizard.step2.selectService",
														"Select service…",
													)
												: t(
														"booking.wizard.step2.noSpecificService",
														"No specific service",
													)}
										</option>
										{(variant === "doctor" ? servicesForSlot : services).map(
											(s) => (
												<option key={s.service_id} value={s.service_id}>
													{s.service_name}
												</option>
											),
										)}
									</StyledSelect>
									{variant === "doctor" && form.date && !doctorSlotRoomType && (
										<p className="mt-1 text-xs text-smile-description">
											{t(
												"booking.wizard.step2.roomTypeNote",
												"Pick a date to narrow this list to what this doctor's room supports.",
											)}
										</p>
									)}
									{variant === "doctor" &&
										doctorSlotRoomType &&
										servicesForSlot.length === 0 && (
											<p className="mt-1 text-xs text-red-400">
												{t(
													"booking.wizard.step2.noServicesForRoom",
													"No services available for this doctor's room type on this date.",
												)}
											</p>
										)}
								</Field>
							)}
							<Field
								label={t("booking.wizard.step2.dateLabel", "Date")}
								required
							>
								<BookingDatePicker
									value={form.date}
									onChange={(v) => set("date", v)}
									minDate={new Date()}
								/>
							</Field>
							<Field
								label={t("booking.wizard.step2.timeLabel", "Time")}
								required
							>
								<BookingTimePicker
									value={form.time}
									onChange={(v) => set("time", v)}
									selectedDate={form.date}
									extendedRange={variant === "outside"}
								/>
							</Field>
						</div>
					)}

					{/* STEP 3 — patient & review */}
					{step === 3 && (
						<div className="flex flex-col gap-5">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{bookingForSelf && isMyPatientFetched && !myPatient ? (
									<div className="flex flex-col gap-1.5 sm:col-span-2">
										<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
											{t(
												"booking.wizard.step3.completeProfileTitle",
												"Complete your patient profile",
											)}
											<span className="ml-1 text-smile-primary">*</span>
										</span>
										<p className="text-xs text-smile-description">
											{t(
												"booking.wizard.step3.completeProfileDesc",
												"First time booking — we need your name and phone number on file before we can confirm an appointment.",
											)}
										</p>
										<div className="flex flex-col gap-2 sm:flex-row">
											<input
												className={inputCls}
												value={myPatientName}
												placeholder={t(
													"booking.wizard.step3.fullNamePlaceholder",
													"Your full name",
												)}
												onChange={(e) => setMyPatientName(e.target.value)}
											/>
											<input
												className={inputCls}
												value={myPatientPhone}
												type="tel"
												placeholder={t(
													"booking.wizard.step3.phonePlaceholder",
													"Your phone number",
												)}
												onChange={(e) => setMyPatientPhone(e.target.value)}
											/>
											<button
												type="button"
												disabled={
													!myPatientName.trim() ||
													!PHONE_REGEX.test(myPatientPhone.trim()) ||
													createMyPatientMut.isPending
												}
												onClick={() =>
													createMyPatientMut.mutate({
														full_name: myPatientName.trim(),
														phone: myPatientPhone.trim(),
													})
												}
												className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-smile-primary px-5 py-2.5 font-inter text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
											>
												{createMyPatientMut.isPending && (
													<Icon
														icon="line-md:loading-twotone-loop"
														width={16}
													/>
												)}
												{t("booking.wizard.step3.save", "Save")}
											</button>
										</div>
										{myPatientPhone.trim() &&
											!PHONE_REGEX.test(myPatientPhone.trim()) && (
												<p className="text-xs text-destructive">
													{t(
														"booking.wizard.step3.phoneInvalid",
														"Enter a valid phone number (10 digits, starting with 0).",
													)}
												</p>
											)}
									</div>
								) : (
									<Field
										label={t("booking.wizard.step3.patientLabel", "Patient")}
										required
									>
										{bookingForSelf ? (
											<input
												className={`${inputCls} cursor-not-allowed opacity-80`}
												value={
													isMyPatientLoading
														? t("booking.wizard.step3.loading", "Loading…")
														: (nameOf.patient ??
															t("booking.wizard.step3.youFallback", "You"))
												}
												readOnly
											/>
										) : (
											<div className="flex flex-col gap-2">
												<div className="relative">
													<Icon
														icon="lucide:search"
														width={15}
														className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smile-description"
													/>
													<input
														value={patientSearch}
														onChange={(e) => setPatientSearch(e.target.value)}
														placeholder={t(
															"booking.wizard.step3.searchPatientPlaceholder",
															"Search patient by name or code…",
														)}
														className={`${inputCls} pl-9`}
													/>
												</div>
												<StyledSelect
													value={form.patient_id}
													onChange={(v) => set("patient_id", v)}
												>
													<option value="">
														{filteredPatients.length
															? t(
																	"booking.wizard.step3.selectPatient",
																	"Select patient…",
																)
															: `${t("booking.wizard.step3.noPatientsMatchPrefix", "No patients match")} "${patientSearch}"`}
													</option>
													{filteredPatients.map((p) => (
														<option key={p.patient_id} value={p.patient_id}>
															{p.full_name} ({p.patient_code})
														</option>
													))}
												</StyledSelect>
											</div>
										)}
									</Field>
								)}
								<Field
									label={t(
										"booking.wizard.step3.chiefComplaint",
										"Chief complaint",
									)}
								>
									<textarea
										className={`${inputCls} h-auto min-h-[44px] resize-y py-2.5`}
										value={form.chief_complaint}
										rows={2}
										placeholder={t(
											"booking.wizard.step3.reasonForVisit",
											"Describe your symptoms in your own words",
										)}
										onChange={(e) => set("chief_complaint", e.target.value)}
									/>
								</Field>
								{variant !== "specialty" && (
									<Field
										label={
											variant === "outside"
												? t(
														"booking.wizard.step3.notesAfterHours",
														"Notes (reason for after-hours)",
													)
												: t("booking.wizard.step3.notes", "Notes")
										}
									>
										<input
											className={inputCls}
											value={form.notes}
											placeholder={
												variant === "outside"
													? t(
															"booking.wizard.step3.afterHoursNotesPlaceholder",
															"Why do you need an after-hours visit?",
														)
													: t(
															"booking.wizard.step3.additionalNotes",
															"Additional notes",
														)
											}
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
									{t("booking.wizard.summary.review", "Review")}
								</p>
								<dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
									{[
										[
											t("booking.wizard.summary.method", "Method"),
											METHODS.find((m) => m.id === variant)?.label
												? t(METHODS.find((m) => m.id === variant)!.label)
												: undefined,
										],
										[
											t("booking.wizard.summary.patient", "Patient"),
											nameOf.patient,
										],
										[
											t("booking.wizard.summary.clinic", "Clinic"),
											nameOf.clinic,
										],
										...(variant === "specialty" || variant === "outside"
											? [
													[
														t("booking.wizard.summary.specialty", "Specialty"),
														nameOf.specialty,
													],
												]
											: variant === "doctor"
												? [
														[
															t("booking.wizard.summary.doctor", "Doctor"),
															nameOf.doctor,
														],
													]
												: []),
										...(variant !== "specialty" && form.service_id
											? [
													[
														t("booking.wizard.summary.service", "Service"),
														nameOf.service,
													],
												]
											: []),
										[
											t("booking.wizard.summary.date", "Date"),
											form.date || "—",
										],
										[
											t("booking.wizard.summary.time", "Time"),
											form.time || "—",
										],
										...(variant !== "facility" &&
										variant !== "outside" &&
										form.chief_complaint
											? [
													[
														t("booking.wizard.summary.reason", "Reason"),
														form.chief_complaint,
													],
												]
											: []),
										...(variant === "outside" && form.notes
											? [
													[
														t("booking.wizard.summary.reason", "Reason"),
														form.notes,
													],
												]
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
					<Icon icon="lucide:arrow-left" width={16} />{" "}
					{t("booking.wizard.nav.back", "Back")}
				</button>

				{step < steps.length - 1 ? (
					<button
						type="button"
						onClick={next}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 font-inter text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
					>
						{t("booking.wizard.nav.continue", "Continue")}{" "}
						<Icon icon="lucide:arrow-right" width={16} />
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
						{t("booking.wizard.nav.confirmBooking", "Confirm Booking")}
					</button>
				)}
			</div>
		</div>
	);
}

export default BookingWizard;
