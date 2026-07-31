"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import { unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const BLUE = "#92CDFD";
const TEAL = "#38BDF8";
const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";
const inputCls =
	"h-11 w-full rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)] [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

const STATUSES = [
	"scheduled",
	"confirmed",
	"completed",
	"cancelled",
	"no_show",
];

interface Appointment {
	appointment_id: string;
	appointment_code: string;
	appointment_date: string;
	appointment_time: string;
	chief_complaint?: string;
	notes?: string;
	status: string;
}

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

export default function EditAppointmentPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const qc = useQueryClient();
	const { t } = useTranslation();

	const {
		data: aptRes,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["appointment", id],
		queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.DETAIL(id)),
		enabled: !!id,
	});
	const apt = useMemo(() => unwrapOne<Appointment>(aptRes), [aptRes]);

	const [form, setForm] = useState({
		appointment_date: "",
		appointment_time: "",
		chief_complaint: "",
		notes: "",
		status: "scheduled",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		if (apt) {
			setForm({
				appointment_date: apt.appointment_date ?? "",
				appointment_time: apt.appointment_time?.slice(0, 5) ?? "",
				chief_complaint: apt.chief_complaint ?? "",
				notes: apt.notes ?? "",
				status: apt.status ?? "scheduled",
			});
		}
	}, [apt]);

	const set = (k: keyof typeof form, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));

	const updateMut = useMutation({
		mutationFn: () =>
			apiClient.patch(API_ENDPOINTS.APPOINTMENT.UPDATE(id), form),
		onSuccess: () => {
			toast.success(t("appointments.edit.updated", "Appointment updated"));
			qc.invalidateQueries({ queryKey: ["appointment", id] });
			router.push(ROUTES.APPOINTMENT_DETAIL(id));
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("appointments.edit.updateFailed", "Failed to update appointment"),
			),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.appointment_date)
			return setError(
				t("appointments.edit.pickDateError", "Please pick a date."),
			);
		if (!form.appointment_time)
			return setError(
				t("appointments.edit.pickTimeError", "Please pick a time."),
			);
		setError("");
		updateMut.mutate();
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
				<div className="flex items-center justify-between">
					<Link
						href={apt ? ROUTES.APPOINTMENT_DETAIL(id) : ROUTES.APPOINTMENTS}
						className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
					>
						<Icon icon="lucide:arrow-left" width={16} />{" "}
						{t("appointments.edit.back", "Back")}
					</Link>
				</div>

				<div>
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-title">
						{t("appointments.edit.title", "Edit Appointment")}
					</h1>
					{apt && (
						<p className="text-sm" style={{ color: TEAL }}>
							<span className="font-mono">{apt.appointment_code}</span>
						</p>
					)}
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("appointments.edit.loading", "Loading…")}
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						{t("appointments.edit.failedToLoad", "Failed to load appointment.")}{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}

				{!isLoading && !isError && apt && (
					<form
						onSubmit={submit}
						className={`${cardBase} flex flex-col gap-4 p-6`}
					>
						{error && (
							<div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
								<Icon icon="lucide:alert-circle" width={15} /> {error}
							</div>
						)}

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label={t("appointments.edit.dateLabel", "Date")}>
								<input
									type="date"
									className={inputCls}
									value={form.appointment_date}
									onChange={(e) => set("appointment_date", e.target.value)}
								/>
							</Field>
							<Field label={t("appointments.edit.timeLabel", "Time")}>
								<input
									type="time"
									className={inputCls}
									value={form.appointment_time}
									onChange={(e) => set("appointment_time", e.target.value)}
								/>
							</Field>
							<Field label={t("appointments.edit.statusLabel", "Status")}>
								<select
									className={inputCls}
									value={form.status}
									onChange={(e) => set("status", e.target.value)}
								>
									{STATUSES.map((s) => (
										<option
											key={s}
											value={s}
											className="text-smile-title [background:var(--surface-input-bg)]"
										>
											{s.replace("_", " ")}
										</option>
									))}
								</select>
							</Field>
							<Field
								label={t(
									"appointments.edit.chiefComplaintLabel",
									"Chief complaint",
								)}
							>
								<input
									className={inputCls}
									value={form.chief_complaint}
									placeholder={t(
										"appointments.edit.chiefComplaintPlaceholder",
										"Reason for visit",
									)}
									onChange={(e) => set("chief_complaint", e.target.value)}
								/>
							</Field>
						</div>

						<Field label={t("appointments.edit.notesLabel", "Notes")}>
							<textarea
								className="min-h-[96px] w-full rounded-xl border px-4 py-3 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)] [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
								value={form.notes}
								placeholder={t(
									"appointments.edit.notesPlaceholder",
									"Additional notes",
								)}
								onChange={(e) => set("notes", e.target.value)}
							/>
						</Field>

						<div className="flex justify-end gap-3 pt-1">
							<Link
								href={ROUTES.APPOINTMENT_DETAIL(id)}
								className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
							>
								{t("appointments.edit.cancel", "Cancel")}
							</Link>
							<button
								type="submit"
								disabled={updateMut.isPending}
								className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
								style={{
									background: BLUE,
									boxShadow: "0 0 15px rgba(146,205,253,0.3)",
								}}
							>
								{updateMut.isPending && (
									<Icon icon="line-md:loading-twotone-loop" width={16} />
								)}{" "}
								{t("appointments.edit.saveChanges", "Save Changes")}
							</button>
						</div>
					</form>
				)}
			</div>
		</AppShell>
	);
}
