"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Icon } from "@iconify/react";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { CancelAppointmentModal } from "@/features/appointment/components/CancelAppointmentModal";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { unwrapArr, unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ENV } from "@/shared/constants/env";
import { resolveDashboardKind } from "@/shared/constants/nav";
import { FRONT_DESK_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const TEAL = "#38BDF8";
const BLUE = "#92CDFD";
const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

const DEFAULT_AMOUNT = 200000;

const STATUS_STYLES: Record<string, string> = {
	scheduled: "bg-[#92CDFD]/15 text-[#92CDFD] border-[#92CDFD]/30",
	confirmed: "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30",
	checked_in: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
	in_progress: "bg-purple-400/15 text-purple-300 border-purple-400/30",
	completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
	cancelled: "bg-red-400/15 text-red-300 border-red-400/30",
	no_show: "bg-amber-400/15 text-amber-300 border-amber-400/30",
};
const PAY_STYLES: Record<string, string> = {
	paid: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
	unpaid:
		"bg-smile-primary-light text-smile-description border-smile-primary/15",
	refunded: "bg-purple-400/15 text-purple-300 border-purple-400/30",
};

interface Appointment {
	appointment_id: string;
	appointment_code: string;
	patient_id: string;
	doctor_id: string;
	clinic_id: string;
	service_id?: string;
	appointment_date: string;
	appointment_time: string;
	duration_minutes?: number;
	appointment_type?: string;
	status: string;
	chief_complaint?: string;
	payment_status: string;
	payment_id?: string;
	notes?: string;
	cancellation_requested?: boolean;
}
interface Clinic {
	clinic_id: string;
	clinic_name: string;
}
interface ServiceRow {
	service_id: string;
	service_name: string;
	base_price?: number;
}
interface Payment {
	payment_id: string;
	amount?: number;
	status?: string;
	created_at?: string;
	payment_date?: string;
}
interface PatientRow {
	patient_id: string;
	full_name?: string;
}
interface UserProfile {
	full_name?: string;
}

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
	return (
		<span
			className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
				map[value] ??
				"bg-smile-primary-light text-smile-description border-smile-primary/15"
			}`}
		>
			{value?.replace("_", " ")}
		</span>
	);
}

function Row({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
			</span>
			<span className="text-sm text-smile-title">{children}</span>
		</div>
	);
}

export default function AppointmentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const qc = useQueryClient();
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const [cancelOpen, setCancelOpen] = useState(false);
	const [assignOpen, setAssignOpen] = useState(false);
	const [assignDoctorId, setAssignDoctorId] = useState("");
	const [assignServiceId, setAssignServiceId] = useState("");

	const {
		data: aptRes,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ["appointment", id],
		queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.DETAIL(id)),
		enabled: !!id,
	});
	const apt = useMemo(() => unwrapOne<Appointment>(aptRes), [aptRes]);

	const { data: clinicsRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const { data: servicesRes } = useQuery({
		queryKey: ["services", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.SERVICE.LIST),
	});
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
	const services = useMemo(
		() => unwrapArr<ServiceRow>(servicesRes),
		[servicesRes],
	);

	const { data: paymentsRes, refetch: refetchPayments } = useQuery({
		queryKey: ["payments", "appointment", id],
		queryFn: () => apiClient.get(API_ENDPOINTS.PAYMENT.BY_APPOINTMENT(id)),
		enabled: !!id,
	});
	const payments = useMemo(() => {
		const arr = unwrapArr<Payment>(paymentsRes);
		if (arr.length) return arr;
		const one = unwrapOne<Payment>(paymentsRes);
		return one && one.payment_id ? [one] : [];
	}, [paymentsRes]);

	// Check-in is a front-desk action; the backend enforces this — mirror it so the button
	// isn't shown to users who can never use it.
	const isFrontDesk = FRONT_DESK_ROLES.some((r) => user?.roles?.includes(r));

	// apt.patient_id is a patient-record id, not the IAM account id — resolve ownership
	// via /patients/me (staff get 403 there, so only query for patient users).
	const isPatientUser = resolveDashboardKind(user?.roles) === "patient";
	const { data: meRes } = useQuery({
		queryKey: ["patients", "me"],
		queryFn: () =>
			apiClient.get<{ patient_id?: string } | null>(
				`${ENV.SERVICES.GATEWAY}/patients/me`,
			),
		enabled: isPatientUser,
	});
	const myPatientId = (
		meRes as { data?: { patient_id?: string } | null } | undefined
	)?.data?.patient_id;
	const isOwningPatient =
		isPatientUser && !!myPatientId && myPatientId === apt?.patient_id;
	// Owning patient
	const isReceptionist = user?.roles?.includes("RECEPTIONIST") ?? false;
	const canEditAppointment = isReceptionist || isOwningPatient;

	const clinicName =
		clinics.find((c) => c.clinic_id === apt?.clinic_id)?.clinic_name ??
		apt?.clinic_id ??
		"—";
	const service = services.find((s) => s.service_id === apt?.service_id);
	const amount = service?.base_price ?? DEFAULT_AMOUNT;

	// Resolve the doctor's display name — mirrors the arrival-doctor lookup
	// above (user-profiles endpoint is unguarded, safe for any role to call).
	const { data: doctorProfileRes } = useQuery({
		queryKey: ["user-profile", apt?.doctor_id],
		queryFn: () =>
			apiClient.get<UserProfile>(
				API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(apt?.doctor_id ?? ""),
			),
		enabled: !!apt?.doctor_id,
		staleTime: 10 * 60 * 1000,
	});
	const doctorName = unwrapOne<UserProfile>(doctorProfileRes)?.full_name;
	const doctorLabel = (doctorId?: string) => {
		if (!doctorId) return "—";
		if (doctorId === user?.userId)
			return user?.fullName ?? user?.email ?? t("appointments.detail.me", "Me");
		return (
			doctorName ||
			`${t("appointments.detail.doctorPrefix", "Doctor")} ${doctorId.slice(0, 8)}`
		);
	};

	// Resolve the patient's display name for the same reason.
	const { data: patientRes } = useQuery({
		queryKey: ["patients", "detail", apt?.patient_id],
		queryFn: () =>
			apiClient.get<PatientRow>(
				API_ENDPOINTS.PATIENT.DETAIL(apt?.patient_id ?? ""),
			),
		enabled: !!apt?.patient_id,
		staleTime: 10 * 60 * 1000,
	});
	const patientName = unwrapOne<PatientRow>(patientRes)?.full_name;
	const patientLabel = patientName || (apt?.patient_id ?? "—");

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: ["appointment", id] });

	const confirmMut = useMutation({
		mutationFn: () =>
			apiClient.patch(API_ENDPOINTS.APPOINTMENT.CONFIRM(id), {
				changed_by: user?.userId,
			}),
		onSuccess: () => {
			toast.success(
				t("appointments.detail.toast.confirmed", "Appointment confirmed"),
			);
			invalidate();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("appointments.detail.toast.confirmFailed", "Failed to confirm"),
			),
	});
	// Front-desk arrival: facility/specialty/outside-hours bookings only had a
	// placeholder doctor auto-assigned at booking time — reception picks the real
	// doctor (from who's actually scheduled at this clinic that day), service, and
	// room once the patient is physically present, then checks them in.
	interface ScheduleRow {
		doctor_id: string;
	}
	const { data: arrivalSchedulesRes } = useQuery({
		queryKey: [
			"doctor-schedules",
			"arrival",
			apt?.clinic_id,
			apt?.appointment_date,
		],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, {
				params: {
					clinic_id: apt?.clinic_id,
					work_date: apt?.appointment_date,
					limit: 50,
				},
			}),
		enabled: assignOpen && !!apt?.clinic_id && !!apt?.appointment_date,
	});
	const arrivalDoctorIds = useMemo(() => {
		const rows = unwrapArr<ScheduleRow>(arrivalSchedulesRes);
		return Array.from(new Set(rows.map((r) => r.doctor_id).filter(Boolean)));
	}, [arrivalSchedulesRes]);
	const arrivalDoctorProfiles = useQueries({
		queries: arrivalDoctorIds.map((did) => ({
			queryKey: ["user-profile", did],
			queryFn: () =>
				apiClient.get<{ full_name?: string }>(
					API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(did),
				),
			staleTime: 10 * 60 * 1000,
		})),
	});
	const arrivalDoctors = useMemo(
		() =>
			arrivalDoctorIds.map((did, i) => ({
				doctor_id: did,
				full_name:
					(
						arrivalDoctorProfiles[i]?.data as
							| { data?: { full_name?: string } }
							| undefined
					)?.data?.full_name || `Doctor ${did.slice(0, 8)}`,
			})),
		[arrivalDoctorIds, arrivalDoctorProfiles],
	);
	const checkInAssignMut = useMutation({
		mutationFn: () =>
			apiClient.patch(API_ENDPOINTS.APPOINTMENT.CHECK_IN_ASSIGN(id), {
				doctor_id: assignDoctorId,
				...(assignServiceId ? { service_id: assignServiceId } : {}),
				checked_in_by: user?.userId,
			}),
		onSuccess: () => {
			toast.success(
				t("appointments.detail.toast.checkedIn", "Patient checked in"),
			);
			setAssignOpen(false);
			invalidate();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("appointments.detail.toast.checkInFailed", "Failed to check in"),
			),
	});

	const cancelMut = useMutation({
		mutationFn: (reason: string) =>
			apiClient.patch(API_ENDPOINTS.APPOINTMENT.CANCEL(id), {
				cancelled_by: user?.userId,
				cancellation_reason: reason,
			}),
		onSuccess: () => {
			// Request only
			toast.success(
				isFrontDesk
					? t(
							"appointments.detail.toast.cancelledFrontDesk",
							"Appointment cancelled",
						)
					: t(
							"appointments.detail.toast.cancelRequested",
							"Cancellation requested — reception will confirm it",
						),
			);
			invalidate();
			setCancelOpen(false);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("appointments.detail.toast.cancelFailed", "Failed to cancel"),
			),
	});
	const sendConfirmMut = useMutation({
		mutationFn: () =>
			apiClient.post(API_ENDPOINTS.APPOINTMENT.SEND_CONFIRMATION(id), {}),
		onSuccess: () =>
			toast.success(
				t("appointments.detail.toast.confirmationSent", "Confirmation sent"),
			),
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"appointments.detail.toast.confirmationSendFailed",
					"Failed to send confirmation",
				),
			),
	});
	const sendReminderMut = useMutation({
		mutationFn: () =>
			apiClient.post(API_ENDPOINTS.APPOINTMENT.SEND_REMINDER(id), {}),
		onSuccess: () =>
			toast.success(
				t("appointments.detail.toast.reminderSent", "Reminder sent"),
			),
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"appointments.detail.toast.reminderSendFailed",
					"Failed to send reminder",
				),
			),
	});
	const payMut = useMutation({
		mutationFn: () =>
			apiClient.post(API_ENDPOINTS.PAYMENT.INITIATE, {
				appointmentId: id,
				amount,
				orderInfo: `Payment for ${apt?.appointment_code ?? id}`,
			}),
		onSuccess: (res) => {
			const url = (res?.data as { data?: { paymentUrl?: string } })?.data
				?.paymentUrl;
			if (url) window.location.href = url;
			else
				toast.error(
					t(
						"appointments.detail.toast.noPaymentUrl",
						"No payment URL returned",
					),
				);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"appointments.detail.toast.paymentStartFailed",
					"Failed to start payment",
				),
			),
	});
	const refundMut = useMutation({
		mutationFn: (paymentId: string) =>
			apiClient.post(API_ENDPOINTS.PAYMENT.REFUND(paymentId), {
				reason: "requested",
			}),
		onSuccess: () => {
			toast.success(
				t("appointments.detail.toast.refundRequested", "Refund requested"),
			);
			refetchPayments();
			invalidate();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("appointments.detail.toast.refundFailed", "Failed to refund"),
			),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-8 py-10">
				<div className="flex items-center justify-end">
					{apt && canEditAppointment && (
						<Link
							href={ROUTES.APPOINTMENT_EDIT(apt.appointment_id)}
							title={t("appointments.detail.editTitle", "Edit")}
							className="flex h-9 w-9 items-center justify-center rounded-full border text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
						>
							<Icon icon="lucide:pencil" width={15} />
						</Link>
					)}
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("appointments.detail.loading", "Loading appointment…")}
					</div>
				)}

				{isError && !isLoading && (
					<ErrorMessage
						message={t(
							"appointments.detail.failedToLoad",
							"Failed to load appointment.",
						)}
						error={error}
						operation="appointment detail"
						onRetry={() => refetch()}
						className={`${cardBase} p-6 text-center`}
					/>
				)}

				{!isLoading && !isError && !apt && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t("appointments.detail.notFound", "Appointment not found.")}
					</div>
				)}

				{apt && (
					<>
						{/* Header card */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p
										className="font-mono text-sm font-semibold"
										style={{ color: TEAL }}
									>
										{apt.appointment_code}
									</p>
									<h1 className="mt-1 font-poppins text-[26px] font-bold tracking-[-0.5px] text-smile-title">
										{apt.appointment_date} · {apt.appointment_time?.slice(0, 5)}
									</h1>
								</div>
								<div className="flex items-center gap-2">
									<Badge value={apt.status} map={STATUS_STYLES} />
									<Badge value={apt.payment_status} map={PAY_STYLES} />
								</div>
							</div>

							{apt.cancellation_requested && apt.status !== "cancelled" && (
								<div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-300">
									<Icon icon="lucide:alert-triangle" width={16} />
									{t(
										"appointments.detail.cancellationRequested",
										"Cancellation requested",
									)}
									{isFrontDesk
										? t(
												"appointments.detail.cancellationRequestedFrontDesk",
												" — press Cancel again to confirm it.",
											)
										: t(
												"appointments.detail.cancellationRequestedPatient",
												" — waiting for reception to confirm.",
											)}
								</div>
							)}

							<div className="grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-2 [border-color:var(--surface-panel-border)]">
								<Row label={t("appointments.detail.patient", "Patient")}>
									{patientLabel}
								</Row>
								<Row label={t("appointments.detail.doctor", "Doctor")}>
									{doctorLabel(apt.doctor_id)}
								</Row>
								<Row label={t("appointments.detail.clinic", "Clinic")}>
									{clinicName}
								</Row>
								<Row label={t("appointments.detail.service", "Service")}>
									{service?.service_name ?? apt.service_id ?? "—"}
								</Row>
								<Row label={t("appointments.detail.type", "Type")}>
									{apt.appointment_type ?? "—"}
								</Row>
								<Row
									label={t(
										"appointments.detail.chiefComplaint",
										"Chief complaint",
									)}
								>
									{apt.chief_complaint || "—"}
								</Row>
								<Row label={t("appointments.detail.notes", "Notes")}>
									{apt.notes || "—"}
								</Row>
							</div>
						</div>

						{/* Actions */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<h2 className="text-sm font-semibold uppercase tracking-[1px] text-smile-description">
								{t("appointments.detail.actions", "Actions")}
							</h2>
							<div className="flex flex-wrap gap-3">
								{apt.status === "scheduled" && (
									<button
										onClick={() => confirmMut.mutate()}
										disabled={confirmMut.isPending}
										title={t("appointments.detail.confirm", "Confirm")}
										className="flex h-11 w-11 items-center justify-center rounded-full text-[#003450] transition hover:brightness-95 disabled:opacity-60"
										style={{
											background: TEAL,
											boxShadow: "0 0 15px rgba(56, 189, 248,0.3)",
										}}
									>
										{confirmMut.isPending ? (
											<Icon icon="line-md:loading-twotone-loop" width={16} />
										) : (
											<Icon icon="lucide:check" width={18} />
										)}
									</button>
								)}
								{isFrontDesk &&
									(apt.status === "scheduled" || apt.status === "confirmed") &&
									!assignOpen && (
										<button
											onClick={() => {
												setAssignDoctorId(apt.doctor_id);
												setAssignServiceId(apt.service_id ?? "");
												setAssignOpen(true);
											}}
											title={t("appointments.detail.checkIn", "Check In")}
											className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:brightness-95"
											style={{
												background: "#10B981",
												boxShadow: "0 0 15px rgba(16,185,129,0.3)",
											}}
										>
											<Icon icon="lucide:log-in" width={18} />
										</button>
									)}
								<button
									onClick={() => sendConfirmMut.mutate()}
									disabled={sendConfirmMut.isPending}
									title={t(
										"appointments.detail.sendConfirmation",
										"Send Confirmation",
									)}
									className="flex h-11 w-11 items-center justify-center rounded-full border text-smile-title transition hover:border-smile-primary/40 disabled:opacity-60 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
								>
									<Icon icon="lucide:mail-check" width={16} />
								</button>
								<button
									onClick={() => sendReminderMut.mutate()}
									disabled={sendReminderMut.isPending}
									title={t("appointments.detail.sendReminder", "Send Reminder")}
									className="flex h-11 w-11 items-center justify-center rounded-full border text-smile-title transition hover:border-smile-primary/40 disabled:opacity-60 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
								>
									<Icon icon="lucide:bell" width={16} />
								</button>
								{apt.status !== "cancelled" && apt.status !== "completed" && (
									<button
										onClick={() => setCancelOpen(true)}
										title={
											isFrontDesk && apt.cancellation_requested
												? t(
														"appointments.detail.confirmCancellation",
														"Confirm Cancellation",
													)
												: t("appointments.detail.cancel", "Cancel")
										}
										className="flex h-11 w-11 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
									>
										<Icon icon="lucide:x-circle" width={16} />
									</button>
								)}
							</div>
						</div>

						{/* Front-desk arrival: assign the real doctor/service/room, then check in */}
						{assignOpen && (
							<div className={`${cardBase} flex flex-col gap-4 p-6`}>
								<h2 className="text-sm font-semibold uppercase tracking-[1px] text-smile-description">
									{t(
										"appointments.detail.assignCheckInTitle",
										"Assign & Check In",
									)}
								</h2>
								<p className="text-xs text-smile-description">
									{t(
										"appointments.detail.assignCheckInDesc",
										"Confirm which doctor and service this patient will see today before checking them in.",
									)}
								</p>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="flex flex-col gap-1.5">
										<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
											{t("appointments.detail.doctorRequired", "Doctor")}
											<span className="ml-1 text-smile-primary">*</span>
										</span>
										<select
											className="h-11 rounded-xl border px-3 text-sm text-smile-title outline-none [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
											value={assignDoctorId}
											onChange={(e) => setAssignDoctorId(e.target.value)}
										>
											<option value="">
												{arrivalDoctors.length
													? t(
															"appointments.detail.selectDoctor",
															"Select doctor…",
														)
													: t(
															"appointments.detail.noDoctorsScheduled",
															"No doctors scheduled at this clinic today",
														)}
											</option>
											{arrivalDoctors.map((d) => (
												<option key={d.doctor_id} value={d.doctor_id}>
													{d.full_name}
												</option>
											))}
										</select>
									</div>
									<div className="flex flex-col gap-1.5">
										<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
											{t(
												"appointments.detail.serviceOptional",
												"Service (optional)",
											)}
										</span>
										<select
											className="h-11 rounded-xl border px-3 text-sm text-smile-title outline-none [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
											value={assignServiceId}
											onChange={(e) => setAssignServiceId(e.target.value)}
										>
											<option value="">
												{t(
													"appointments.detail.noSpecificService",
													"No specific service",
												)}
											</option>
											{services.map((s) => (
												<option key={s.service_id} value={s.service_id}>
													{s.service_name}
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="flex gap-3">
									<button
										onClick={() => checkInAssignMut.mutate()}
										disabled={!assignDoctorId || checkInAssignMut.isPending}
										className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
										style={{
											background: "#10B981",
											boxShadow: "0 0 15px rgba(16,185,129,0.3)",
										}}
									>
										{checkInAssignMut.isPending && (
											<Icon icon="line-md:loading-twotone-loop" width={16} />
										)}
										{t(
											"appointments.detail.confirmCheckIn",
											"Confirm Check-In",
										)}
									</button>
									<button
										onClick={() => setAssignOpen(false)}
										className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
									>
										{t("appointments.detail.cancel", "Cancel")}
									</button>
								</div>
							</div>
						)}

						{/* Payment */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex items-center justify-between">
								<h2 className="text-sm font-semibold uppercase tracking-[1px] text-smile-description">
									{t("appointments.detail.payment", "Payment")}
								</h2>
								<Badge value={apt.payment_status} map={PAY_STYLES} />
							</div>

							{apt.payment_status === "unpaid" && (
								<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
									<div>
										<p className="text-sm text-smile-description">
											{t("appointments.detail.amountDue", "Amount due")}
										</p>
										<p className="text-lg font-bold text-smile-title">
											{amount.toLocaleString()} VND
										</p>
									</div>
									{isOwningPatient && (
										<button
											onClick={() => payMut.mutate()}
											disabled={payMut.isPending}
											className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
											style={{
												background: BLUE,
												boxShadow: "0 0 15px rgba(146,205,253,0.3)",
											}}
										>
											{payMut.isPending && (
												<Icon icon="line-md:loading-twotone-loop" width={16} />
											)}{" "}
											{t("appointments.detail.payNow", "Pay now")}
										</button>
									)}
								</div>
							)}

							{payments.length > 0 ? (
								<div className="overflow-x-auto rounded-xl border [border-color:var(--surface-panel-border)]">
									<table className="w-full text-left text-sm">
										<thead className="border-b text-xs uppercase tracking-wide text-smile-description [border-color:var(--surface-panel-border)]">
											<tr>
												<th className="px-4 py-3">
													{t("appointments.detail.tableAmount", "Amount")}
												</th>
												<th className="px-4 py-3">
													{t("appointments.detail.tableStatus", "Status")}
												</th>
												<th className="px-4 py-3">
													{t("appointments.detail.tableDate", "Date")}
												</th>
												<th className="px-4 py-3 text-right">
													{t("appointments.detail.tableAction", "Action")}
												</th>
											</tr>
										</thead>
										<tbody>
											{payments.map((p) => (
												<tr
													key={p.payment_id}
													className="border-b last:border-0 [border-color:var(--surface-panel-border)]"
												>
													<td className="px-4 py-3 text-smile-title">
														{(p.amount ?? 0).toLocaleString()} VND
													</td>
													<td className="px-4 py-3">
														<Badge
															value={p.status ?? "unpaid"}
															map={PAY_STYLES}
														/>
													</td>
													<td className="px-4 py-3 text-smile-description">
														{p.payment_date ?? p.created_at ?? "—"}
													</td>
													<td className="px-4 py-3 text-right">
														{p.status === "paid" && isOwningPatient && (
															<button
																onClick={() => refundMut.mutate(p.payment_id)}
																disabled={refundMut.isPending}
																className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-60"
															>
																{t("appointments.detail.refund", "Refund")}
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								apt.payment_status !== "unpaid" && (
									<p className="text-sm text-smile-description">
										{t(
											"appointments.detail.noPaymentRecords",
											"No payment records.",
										)}
									</p>
								)
							)}
						</div>
					</>
				)}
			</div>

			{cancelOpen && (
				<CancelAppointmentModal
					submitting={cancelMut.isPending}
					onSubmit={(reason) => cancelMut.mutate(reason)}
					onClose={() => setCancelOpen(false)}
				/>
			)}
		</AppShell>
	);
}
