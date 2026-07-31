"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import {
	DOCTORS,
	SCHEDULE_STATUSES,
	unwrapArr,
} from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

export interface ScheduleFormValues {
	doctor_id: string;
	clinic_id: string;
	work_date: string;
	shift_id?: string;
	room_id?: string;
	max_patients?: number;
	status?: string;
	notes?: string;
}

interface Clinic {
	clinic_id: string;
	clinic_name: string;
}
interface Shift {
	shift_id: string;
	shift_name: string;
	start_time?: string;
	end_time?: string;
}

const inputCls =
	"h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50";

function Field({
	label,
	required,
	children,
	colSpan,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
	colSpan?: boolean;
}) {
	return (
		<label
			className={`flex flex-col gap-1.5 ${colSpan ? "sm:col-span-2" : ""}`}
		>
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
				{required && <span className="text-smile-primary"> *</span>}
			</span>
			{children}
		</label>
	);
}

export function ScheduleForm({
	mode,
	initial,
	lockDoctor,
	doctorLabel,
	submitting,
	submitLabel,
	onSubmit,
	onCancel,
}: {
	mode: "create" | "edit";
	initial?: Partial<ScheduleFormValues>;
	lockDoctor?: boolean; // for "register personal schedule" — fix to current doctor
	doctorLabel?: string;
	submitting?: boolean;
	submitLabel: string;
	onSubmit: (v: ScheduleFormValues) => void;
	onCancel?: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState<ScheduleFormValues>({
		doctor_id: "",
		clinic_id: "",
		work_date: "",
		shift_id: "",
		room_id: "",
		max_patients: 20,
		status: "scheduled",
		notes: "",
		...initial,
	});
	const [error, setError] = useState("");
	const set = (k: keyof ScheduleFormValues, v: string | number) =>
		setForm((f) => ({ ...f, [k]: v }));

	const { data: clinicRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const { data: shiftRes } = useQuery({
		queryKey: ["work-shifts", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.WORK_SHIFT.LIST),
	});
	const clinics = unwrapArr<Clinic>(clinicRes);
	const shifts = unwrapArr<Shift>(shiftRes);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			mode === "create" &&
			(!form.doctor_id || !form.clinic_id || !form.work_date)
		) {
			setError(
				t(
					"schedule.scheduleForm.requiredError",
					"Doctor, clinic and work date are required.",
				),
			);
			return;
		}
		setError("");
		// Edit only sends mutable fields (BE update DTO).
		const payload: ScheduleFormValues = mode === "edit" ? { ...form } : form;
		onSubmit(payload);
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-5">
			{error && (
				<div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					<Icon icon="lucide:alert-circle" width={16} /> {error}
				</div>
			)}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field
					label={t("schedule.scheduleForm.doctorLabel", "Doctor")}
					required
				>
					{lockDoctor ? (
						<input
							className={inputCls}
							value={doctorLabel ?? form.doctor_id}
							readOnly
							aria-label={t(
								"schedule.scheduleForm.lockedDoctorAria",
								"Locked doctor",
							)}
						/>
					) : (
						<select
							className={inputCls}
							value={form.doctor_id}
							disabled={mode === "edit"}
							onChange={(e) => set("doctor_id", e.target.value)}
						>
							<option
								value=""
								className="[background:var(--surface-input-bg)] text-smile-title"
							>
								{t("schedule.scheduleForm.selectDoctor", "Select doctor…")}
							</option>
							{DOCTORS.map((d) => (
								<option
									key={d.id}
									value={d.id}
									className="[background:var(--surface-input-bg)] text-smile-title"
								>
									{d.name}
								</option>
							))}
						</select>
					)}
				</Field>

				<Field
					label={t("schedule.scheduleForm.clinicLabel", "Clinic")}
					required
				>
					<select
						className={inputCls}
						value={form.clinic_id}
						disabled={mode === "edit"}
						onChange={(e) => set("clinic_id", e.target.value)}
					>
						<option
							value=""
							className="[background:var(--surface-input-bg)] text-smile-title"
						>
							{t("schedule.scheduleForm.selectClinic", "Select clinic…")}
						</option>
						{clinics.map((c) => (
							<option
								key={c.clinic_id}
								value={c.clinic_id}
								className="[background:var(--surface-input-bg)] text-smile-title"
							>
								{c.clinic_name}
							</option>
						))}
					</select>
				</Field>

				<Field
					label={t("schedule.scheduleForm.workDateLabel", "Work date")}
					required
				>
					<input
						type="date"
						className={inputCls}
						value={form.work_date}
						disabled={mode === "edit"}
						onChange={(e) => set("work_date", e.target.value)}
					/>
				</Field>

				<Field label={t("schedule.scheduleForm.shiftLabel", "Shift")}>
					<select
						className={inputCls}
						value={form.shift_id ?? ""}
						onChange={(e) => set("shift_id", e.target.value)}
					>
						<option
							value=""
							className="[background:var(--surface-input-bg)] text-smile-title"
						>
							{t("schedule.scheduleForm.noShift", "No shift")}
						</option>
						{shifts.map((s) => (
							<option
								key={s.shift_id}
								value={s.shift_id}
								className="[background:var(--surface-input-bg)] text-smile-title"
							>
								{s.shift_name}
								{s.start_time ? ` (${s.start_time}–${s.end_time})` : ""}
							</option>
						))}
					</select>
				</Field>

				<Field
					label={t("schedule.scheduleForm.maxPatientsLabel", "Max patients")}
				>
					<input
						type="number"
						className={inputCls}
						value={form.max_patients ?? ""}
						onChange={(e) => set("max_patients", Number(e.target.value))}
					/>
				</Field>

				<Field label={t("schedule.scheduleForm.statusLabel", "Status")}>
					<select
						className={inputCls}
						value={form.status ?? "scheduled"}
						onChange={(e) => set("status", e.target.value)}
					>
						{SCHEDULE_STATUSES.map((s) => (
							<option
								key={s}
								value={s}
								className="[background:var(--surface-input-bg)] text-smile-title"
							>
								{s}
							</option>
						))}
					</select>
				</Field>

				<Field label={t("schedule.scheduleForm.notesLabel", "Notes")} colSpan>
					<input
						className={inputCls}
						value={form.notes ?? ""}
						placeholder={t(
							"schedule.scheduleForm.notesPlaceholder",
							"Optional notes…",
						)}
						onChange={(e) => set("notes", e.target.value)}
					/>
				</Field>
			</div>

			<div className="flex justify-end gap-3">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-3 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
					>
						{t("schedule.scheduleForm.cancel", "Cancel")}
					</button>
				)}
				<button
					type="submit"
					disabled={submitting}
					className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
				>
					{submitting && (
						<Icon icon="line-md:loading-twotone-loop" width={16} />
					)}
					{submitLabel}
				</button>
			</div>
		</form>
	);
}

export default ScheduleForm;
