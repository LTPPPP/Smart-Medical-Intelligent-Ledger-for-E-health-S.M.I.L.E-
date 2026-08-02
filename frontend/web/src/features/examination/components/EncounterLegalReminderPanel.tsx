"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	examinationApi,
	type AppointmentNotificationLog,
	type PatientRepresentative,
} from "@/features/examination/api/examination";
import { useTranslation } from "@/features/i18n";
import { InlineFeedback } from "@/shared/components/ui/InlineFeedback";
import { toast } from "@/shared/lib/toast";

const TEAL = "#38BDF8";
const BLUE = "#92CDFD";
const cardBase =
	"rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-md";
const panelBase =
	"border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]";
const inputCls =
	"rounded-lg border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-3 py-2 text-sm text-smile-title outline-none transition focus:border-smile-primary/50";
const ghostButton =
	"border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] text-smile-title transition hover:[border-color:var(--surface-card-border)]";

interface EncounterLegalReminderPanelProps {
	sessionId: string;
	patientId: string;
	appointmentId?: string | null;
	actorId?: string | null;
}

interface RepresentativeForm {
	representative_id?: string;
	full_name: string;
	relationship: string;
	phone: string;
	email: string;
	legal_document_type: string;
	legal_document_number: string;
	is_primary: boolean;
	is_active: boolean;
	authorized_for_treatment: boolean;
	authorized_for_payment: boolean;
	authorized_for_records: boolean;
}

interface ReminderPreferenceForm {
	enabled: boolean;
	reminder_minutes_before: number;
}

const emptyRepresentativeForm = (makePrimary = false): RepresentativeForm => ({
	full_name: "",
	relationship: "",
	phone: "",
	email: "",
	legal_document_type: "",
	legal_document_number: "",
	is_primary: makePrimary,
	is_active: true,
	authorized_for_treatment: true,
	authorized_for_payment: false,
	authorized_for_records: true,
});

const emptyReminderPreferenceForm = (): ReminderPreferenceForm => ({
	enabled: true,
	reminder_minutes_before: 1440,
});

export function EncounterLegalReminderPanel({
	sessionId,
	patientId,
	appointmentId,
}: EncounterLegalReminderPanelProps) {
	const { t } = useTranslation();
	const qc = useQueryClient();
	const [representativeForm, setRepresentativeForm] =
		useState<RepresentativeForm>(emptyRepresentativeForm());
	const [representativeError, setRepresentativeError] = useState("");
	const [showRepresentativeForm, setShowRepresentativeForm] = useState(false);
	const [reminderForm, setReminderForm] = useState<ReminderPreferenceForm>(
		emptyReminderPreferenceForm(),
	);

	const representativesKey = [
		"examination",
		sessionId,
		"patient-representatives",
		patientId,
	];
	const logsKey = [
		"examination",
		sessionId,
		"appointment-notification-logs",
		appointmentId,
	];
	const reminderPreferenceKey = [
		"examination",
		sessionId,
		"appointment-reminder-preference",
		appointmentId,
	];

	const { data: representatives = [], isLoading: representativesLoading } =
		useQuery({
			queryKey: representativesKey,
			queryFn: () => examinationApi.getPatientRepresentatives(patientId),
			enabled: !!patientId,
		});

	const { data: notificationLogs = [], isLoading: logsLoading } = useQuery({
		queryKey: logsKey,
		queryFn: () =>
			examinationApi.getAppointmentNotificationLogs(appointmentId!),
		enabled: !!appointmentId,
	});
	const { data: reminderPreference } = useQuery({
		queryKey: reminderPreferenceKey,
		queryFn: () => examinationApi.getReminderPreference(appointmentId!),
		enabled: !!appointmentId,
	});

	useEffect(() => {
		if (!reminderPreference) return;
		setReminderForm({
			enabled: reminderPreference.enabled,
			reminder_minutes_before:
				reminderPreference.reminder_minutes_before ?? 1440,
		});
	}, [reminderPreference]);

	const primaryRepresentative = representatives.find(
		(representative) => representative.is_primary,
	);
	const latestReminderLog = notificationLogs[0] ?? null;

	const representativeSummary = useMemo(() => {
		if (!representatives.length)
			return t(
				"examination.legalReminder.representative.summaryEmpty",
				"No representative recorded",
			);
		const primary = primaryRepresentative ?? representatives[0];
		return `${primary.full_name} · ${primary.relationship}`;
	}, [primaryRepresentative, representatives, t]);

	const saveRepresentative = useMutation({
		mutationFn: (form: RepresentativeForm) => {
			const payload = {
				full_name: form.full_name,
				relationship: form.relationship,
				phone: form.phone,
				email: form.email || null,
				legal_document_type: form.legal_document_type || null,
				legal_document_number: form.legal_document_number || null,
				is_primary: form.is_primary,
				is_active: form.is_active,
				authorized_for_treatment: form.authorized_for_treatment,
				authorized_for_payment: form.authorized_for_payment,
				authorized_for_records: form.authorized_for_records,
			};

			if (form.representative_id) {
				return examinationApi.updatePatientRepresentative(
					form.representative_id,
					payload,
				);
			}

			return examinationApi.createPatientRepresentative({
				patient_id: patientId,
				...payload,
			});
		},
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.representativeSaved",
					"Representative saved",
				),
			);
			qc.invalidateQueries({ queryKey: representativesKey });
			setRepresentativeForm(
				emptyRepresentativeForm(representatives.length === 0),
			);
			setRepresentativeError("");
			setShowRepresentativeForm(false);
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.representativeSaveFailed",
					"Failed to save representative",
				),
			),
	});

	const updateReminderPreference = useMutation({
		mutationFn: () =>
			examinationApi.updateReminderPreference(appointmentId!, reminderForm),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.reminderPreferenceSaved",
					"Reminder preference saved",
				),
			);
			qc.invalidateQueries({ queryKey: reminderPreferenceKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.reminderPreferenceSaveFailed",
					"Failed to save reminder preference",
				),
			),
	});

	const verifyRepresentative = useMutation({
		mutationFn: (representativeId: string) =>
			examinationApi.verifyPatientRepresentative(representativeId),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.representativeVerified",
					"Representative verified",
				),
			);
			qc.invalidateQueries({ queryKey: representativesKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.representativeVerifyFailed",
					"Failed to verify representative",
				),
			),
	});

	const sendReminder = useMutation({
		mutationFn: () => examinationApi.sendAppointmentReminder(appointmentId!),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.reminderSent",
					"Reminder action recorded",
				),
			);
			qc.invalidateQueries({ queryKey: logsKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.reminderSendFailed",
					"Failed to send reminder",
				),
			),
	});

	const retryReminder = useMutation({
		mutationFn: () => examinationApi.retryAppointmentReminder(appointmentId!),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.reminderRetried",
					"Reminder retry recorded",
				),
			);
			qc.invalidateQueries({ queryKey: logsKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.reminderRetryFailed",
					"Failed to retry reminder",
				),
			),
	});

	const markRead = useMutation({
		mutationFn: () =>
			examinationApi.markAppointmentReminderRead(appointmentId!),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.reminderMarkedRead",
					"Reminder marked as read",
				),
			);
			qc.invalidateQueries({ queryKey: logsKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.reminderMarkReadFailed",
					"Failed to mark reminder read",
				),
			),
	});

	const markResponded = useMutation({
		mutationFn: () =>
			examinationApi.markAppointmentReminderResponded(appointmentId!),
		onSuccess: () => {
			toast.success(
				t(
					"examination.legalReminder.toast.reminderMarkedResponded",
					"Reminder marked as responded",
				),
			);
			qc.invalidateQueries({ queryKey: logsKey });
		},
		onError: (error) =>
			toast.apiError(
				error,
				t(
					"examination.legalReminder.toast.reminderMarkRespondedFailed",
					"Failed to mark reminder responded",
				),
			),
	});

	const openCreateRepresentative = () => {
		setRepresentativeForm(
			emptyRepresentativeForm(representatives.length === 0),
		);
		setRepresentativeError("");
		setShowRepresentativeForm(true);
	};

	const openEditRepresentative = (representative: PatientRepresentative) => {
		setRepresentativeForm({
			representative_id: representative.representative_id,
			full_name: representative.full_name ?? "",
			relationship: representative.relationship ?? "",
			phone: representative.phone ?? "",
			email: representative.email ?? "",
			legal_document_type: representative.legal_document_type ?? "",
			legal_document_number: representative.legal_document_number ?? "",
			is_primary: Boolean(representative.is_primary),
			is_active: representative.is_active !== false,
			authorized_for_treatment: Boolean(
				representative.authorized_for_treatment,
			),
			authorized_for_payment: Boolean(representative.authorized_for_payment),
			authorized_for_records: Boolean(representative.authorized_for_records),
		});
		setRepresentativeError("");
		setShowRepresentativeForm(true);
	};

	const submitRepresentative = (event: FormEvent) => {
		event.preventDefault();
		const blocker = getRepresentativeFormBlocker(representativeForm, patientId);
		if (blocker) {
			setRepresentativeError(blocker);
			return;
		}
		setRepresentativeError("");
		saveRepresentative.mutate(representativeForm);
	};

	const saveReminderPreference = (event: FormEvent) => {
		event.preventDefault();
		if (!appointmentId) {
			toast.warning(
				t(
					"examination.legalReminder.validation.noAppointment",
					"Session has no linked appointment.",
				),
			);
			return;
		}
		if (reminderForm.reminder_minutes_before < 5) {
			toast.warning(
				t(
					"examination.legalReminder.validation.leadTimeMin",
					"Reminder lead time must be at least 5 minutes.",
				),
			);
			return;
		}
		updateReminderPreference.mutate();
	};

	const hasAppointment = Boolean(appointmentId);
	const retryDisabled =
		!hasAppointment ||
		latestReminderLog?.status !== "failed" ||
		retryReminder.isPending;

	return (
		<div className={`${cardBase} grid gap-5 p-6 lg:grid-cols-2`}>
			<section className="flex min-w-0 flex-col gap-4">
				<PanelHeader
					icon="lucide:users-round"
					title="Legal representative"
					subtitle={representativeSummary}
					actionLabel="Add"
					onAction={openCreateRepresentative}
				/>

				{showRepresentativeForm && (
					<form
						onSubmit={submitRepresentative}
						className={`flex flex-col gap-3 rounded-2xl p-4 ${panelBase}`}
					>
						<div className="grid gap-3 sm:grid-cols-2">
							<InlineField label="Full name">
								<input
									className={inputCls}
									value={representativeForm.full_name}
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											full_name: event.target.value,
										}))
									}
								/>
							</InlineField>
							<InlineField label="Relationship">
								<input
									className={inputCls}
									value={representativeForm.relationship}
									placeholder="mother, father, guardian"
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											relationship: event.target.value,
										}))
									}
								/>
							</InlineField>
							<InlineField label="Phone">
								<input
									className={inputCls}
									value={representativeForm.phone}
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											phone: event.target.value,
										}))
									}
								/>
							</InlineField>
							<InlineField label="Email">
								<input
									className={inputCls}
									value={representativeForm.email}
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											email: event.target.value,
										}))
									}
								/>
							</InlineField>
							<InlineField label="Document type">
								<input
									className={inputCls}
									value={representativeForm.legal_document_type}
									placeholder="CCCD, passport"
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											legal_document_type: event.target.value,
										}))
									}
								/>
							</InlineField>
							<InlineField label="Document number">
								<input
									className={inputCls}
									value={representativeForm.legal_document_number}
									onChange={(event) =>
										setRepresentativeForm((form) => ({
											...form,
											legal_document_number: event.target.value,
										}))
									}
								/>
							</InlineField>
						</div>
						<div className="grid gap-2 sm:grid-cols-2">
							<CheckLine
								label="Primary representative"
								checked={representativeForm.is_primary}
								onChange={(checked) =>
									setRepresentativeForm((form) => ({
										...form,
										is_primary: checked,
									}))
								}
							/>
							<CheckLine
								label="Active"
								checked={representativeForm.is_active}
								onChange={(checked) =>
									setRepresentativeForm((form) => ({
										...form,
										is_active: checked,
									}))
								}
							/>
							<CheckLine
								label="Treatment consent"
								checked={representativeForm.authorized_for_treatment}
								onChange={(checked) =>
									setRepresentativeForm((form) => ({
										...form,
										authorized_for_treatment: checked,
									}))
								}
							/>
							<CheckLine
								label="Payment consent"
								checked={representativeForm.authorized_for_payment}
								onChange={(checked) =>
									setRepresentativeForm((form) => ({
										...form,
										authorized_for_payment: checked,
									}))
								}
							/>
							<CheckLine
								label="Records consent"
								checked={representativeForm.authorized_for_records}
								onChange={(checked) =>
									setRepresentativeForm((form) => ({
										...form,
										authorized_for_records: checked,
									}))
								}
							/>
						</div>
						{representativeError && (
							<InlineFeedback tone="error" className="py-2.5">
								{representativeError}
							</InlineFeedback>
						)}
						<div className="flex flex-wrap justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowRepresentativeForm(false);
									setRepresentativeError("");
								}}
								className={`rounded-full px-4 py-2 text-xs font-semibold ${ghostButton}`}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saveRepresentative.isPending}
								className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
							>
								{saveRepresentative.isPending && (
									<Icon icon="line-md:loading-twotone-loop" width={14} />
								)}
								Save representative
							</button>
						</div>
					</form>
				)}

				{representativesLoading ? (
					<PanelLoading label="Loading representatives" />
				) : representatives.length === 0 ? (
					<p className="text-sm text-smile-description">
						No guardian or legal representative recorded.
					</p>
				) : (
					<div className="flex flex-col gap-3">
						{representatives.map((representative) => (
							<RepresentativeRow
								key={representative.representative_id}
								representative={representative}
								onEdit={() => openEditRepresentative(representative)}
								onVerify={() =>
									verifyRepresentative.mutate(representative.representative_id)
								}
								isVerifying={
									verifyRepresentative.isPending &&
									verifyRepresentative.variables ===
										representative.representative_id
								}
							/>
						))}
					</div>
				)}
			</section>

			<section className="flex min-w-0 flex-col gap-4">
				<PanelHeader
					icon="lucide:bell-ring"
					title="Recall reminders"
					subtitle={
						hasAppointment
							? latestReminderLog
								? `${latestReminderLog.status ?? "log"} · ${
										latestReminderLog.created_at
											? formatDateTime(latestReminderLog.created_at)
											: "latest"
									}`
								: "No reminder log yet"
							: "No linked appointment"
					}
				/>

				<form
					onSubmit={saveReminderPreference}
					className={`flex flex-col gap-3 rounded-2xl p-4 ${panelBase}`}
				>
					<div className="grid gap-3 sm:grid-cols-[1fr_160px]">
						<CheckLine
							label="Reminder enabled"
							checked={reminderForm.enabled}
							disabled={!hasAppointment}
							onChange={(checked) =>
								setReminderForm((form) => ({ ...form, enabled: checked }))
							}
						/>
						<InlineField label="Lead time">
							<select
								className={inputCls}
								value={reminderForm.reminder_minutes_before}
								disabled={!hasAppointment}
								onChange={(event) =>
									setReminderForm((form) => ({
										...form,
										reminder_minutes_before: Number(event.target.value),
									}))
								}
							>
								<option value={60}>1 hour</option>
								<option value={360}>6 hours</option>
								<option value={720}>12 hours</option>
								<option value={1440}>1 day</option>
								<option value={2880}>2 days</option>
							</select>
						</InlineField>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="submit"
							disabled={!hasAppointment || updateReminderPreference.isPending}
							className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
							style={{ background: BLUE }}
						>
							<Icon icon="lucide:save" width={14} />
							Save preference
						</button>
						<button
							type="button"
							disabled={!hasAppointment || sendReminder.isPending}
							onClick={() => sendReminder.mutate()}
							className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
						>
							<Icon icon="lucide:send" width={14} />
							Send now
						</button>
						<button
							type="button"
							disabled={retryDisabled}
							onClick={() => retryReminder.mutate()}
							className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
						>
							<Icon icon="lucide:rotate-cw" width={14} />
							Retry failed
						</button>
						<button
							type="button"
							disabled={
								!hasAppointment || !latestReminderLog || markRead.isPending
							}
							onClick={() => markRead.mutate()}
							className={`rounded-full p-2 disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
							title="Mark read"
						>
							<Icon icon="lucide:mail-open" width={15} />
						</button>
						<button
							type="button"
							disabled={
								!hasAppointment || !latestReminderLog || markResponded.isPending
							}
							onClick={() => markResponded.mutate()}
							className={`rounded-full p-2 disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
							title="Mark responded"
						>
							<Icon icon="lucide:message-circle-check" width={15} />
						</button>
					</div>
				</form>

				{logsLoading ? (
					<PanelLoading label="Loading reminder logs" />
				) : notificationLogs.length === 0 ? (
					<p className="text-sm text-smile-description">
						No recall reminder activity recorded.
					</p>
				) : (
					<div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
						{notificationLogs.slice(0, 6).map((log) => (
							<ReminderLogRow key={log.log_id} log={log} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}

function PanelHeader({
	icon,
	title,
	subtitle,
	actionLabel,
	onAction,
}: {
	icon: string;
	title: string;
	subtitle: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div className="flex min-w-0 items-start gap-3">
				<span
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${panelBase}`}
				>
					<Icon icon={icon} width={19} style={{ color: TEAL }} />
				</span>
				<div className="min-w-0">
					<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
						{title}
					</h2>
					<p className="truncate text-xs text-smile-description">{subtitle}</p>
				</div>
			</div>
			{actionLabel && onAction && (
				<button
					type="button"
					onClick={onAction}
					className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${ghostButton}`}
				>
					<Icon icon="lucide:plus" width={14} />
					{actionLabel}
				</button>
			)}
		</div>
	);
}

function InlineField({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-[10px] font-bold uppercase tracking-[1.5px] text-smile-description">
				{label}
			</span>
			{children}
		</label>
	);
}

function CheckLine({
	label,
	checked,
	disabled,
	onChange,
}: {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label
			className={`flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 ${panelBase}`}
		>
			<span className="text-xs font-semibold text-smile-title">{label}</span>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange(event.target.checked)}
				className="h-4 w-4 accent-smile-primary"
			/>
		</label>
	);
}

function PanelLoading({ label }: { label: string }) {
	return (
		<div className={`flex items-center gap-2 rounded-xl p-4 ${panelBase}`}>
			<Icon icon="line-md:loading-twotone-loop" width={16} />
			<span className="text-sm text-smile-description">{label}</span>
		</div>
	);
}

function RepresentativeRow({
	representative,
	onEdit,
	onVerify,
	isVerifying,
}: {
	representative: PatientRepresentative;
	onEdit: () => void;
	onVerify: () => void;
	isVerifying?: boolean;
}) {
	const scopes = [
		representative.authorized_for_treatment ? "treatment" : "",
		representative.authorized_for_payment ? "payment" : "",
		representative.authorized_for_records ? "records" : "",
	].filter(Boolean);

	return (
		<div
			className={`group flex items-start justify-between gap-3 rounded-xl p-4 ${panelBase}`}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<span className="break-words text-sm font-semibold text-smile-title">
						{representative.full_name}
					</span>
					{representative.is_primary && <Badge label="primary" tone="blue" />}
					{representative.verified_at && <Badge label="verified" tone="teal" />}
				</div>
				<p className="mt-1 text-xs text-smile-description">
					{representative.relationship} · {representative.phone}
				</p>
				<p className="mt-1 text-xs text-smile-description">
					Scopes: {scopes.join(", ") || "none"}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
				{!representative.verified_at && (
					<button
						type="button"
						onClick={onVerify}
						disabled={isVerifying}
						className="rounded p-1 text-smile-description transition hover:text-smile-primary disabled:opacity-50"
						title="Verify representative"
					>
						<Icon
							icon={
								isVerifying
									? "line-md:loading-twotone-loop"
									: "lucide:shield-check"
							}
							width={14}
						/>
					</button>
				)}
				<button
					type="button"
					onClick={onEdit}
					className="rounded p-1 text-smile-description transition hover:text-smile-primary"
					title="Edit representative"
				>
					<Icon icon="lucide:pencil" width={14} />
				</button>
			</div>
		</div>
	);
}

function ReminderLogRow({ log }: { log: AppointmentNotificationLog }) {
	return (
		<div className={`rounded-xl p-4 ${panelBase}`}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-smile-title">
						{log.status ?? "log"}
					</span>
					<Badge
						label={`attempt ${log.attempt_count ?? 0}`}
						tone={log.status === "failed" ? "red" : "blue"}
					/>
				</div>
				<span className="text-xs text-smile-description">
					{formatDateTime(log.created_at)}
				</span>
			</div>
			<div className="mt-2 grid gap-1 text-xs text-smile-description sm:grid-cols-2">
				<span>Read: {formatDateTime(log.read_at)}</span>
				<span>Responded: {formatDateTime(log.responded_at)}</span>
				<span>Retry: {formatDateTime(log.next_retry_at)}</span>
				<span>
					Preference: {log.preference_enabled === false ? "off" : "on"}
				</span>
			</div>
			{log.error_message && (
				<p className="mt-2 break-words text-xs text-destructive">
					{log.error_message}
				</p>
			)}
		</div>
	);
}

function Badge({
	label,
	tone,
}: {
	label: string;
	tone: "blue" | "teal" | "red";
}) {
	const toneClass = {
		blue: "bg-[#92CDFD]/15 text-[#92CDFD]",
		teal: "bg-[#38BDF8]/15 text-[#38BDF8]",
		red: "bg-destructive/10 text-destructive",
	}[tone];

	return (
		<span
			className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${toneClass}`}
		>
			{label}
		</span>
	);
}

function getRepresentativeFormBlocker(
	form: RepresentativeForm,
	patientId: string,
) {
	if (!patientId) return "Session has no patient.";
	if (!form.full_name.trim()) return "Representative name is required.";
	if (!form.relationship.trim()) return "Relationship is required.";
	if (!form.phone.trim()) return "Representative phone is required.";
	if (
		form.is_active &&
		!form.authorized_for_treatment &&
		!form.authorized_for_payment &&
		!form.authorized_for_records
	) {
		return "Select at least one authorization scope.";
	}
	return null;
}

function formatDateTime(value?: string | null) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString();
}
