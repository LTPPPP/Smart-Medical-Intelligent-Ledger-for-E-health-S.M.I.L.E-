"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";

const BLUE = "#92CDFD";

export interface WorkShiftFormValues {
	shift_name: string;
	start_time: string; // 'HH:mm'
	end_time: string; // 'HH:mm'
	description?: string | null;
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

const inputCls =
	"h-11 rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

export function WorkShiftModal({
	initial,
	submitting,
	title,
	onSubmit,
	onClose,
}: {
	initial?: Partial<WorkShiftFormValues>;
	submitting?: boolean;
	title: string;
	onSubmit: (v: WorkShiftFormValues) => void;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState<WorkShiftFormValues>({
		shift_name: "",
		start_time: "",
		end_time: "",
		description: "",
		...initial,
	});
	const [error, setError] = useState("");

	const set = <K extends keyof WorkShiftFormValues>(
		k: K,
		v: WorkShiftFormValues[K],
	) => setForm((f) => ({ ...f, [k]: v }));

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.shift_name.trim() || !form.start_time || !form.end_time) {
			setError(
				t("schedule.workShiftModal.requiredError", "Shift name, start time and end time are required."),
			);
			return;
		}
		if (form.start_time >= form.end_time) {
			setError(t("schedule.workShiftModal.timeOrderError", "Start time must be before end time."));
			return;
		}
		setError("");
		onSubmit({
			shift_name: form.shift_name.trim(),
			start_time: form.start_time,
			end_time: form.end_time,
			description: form.description?.trim() ? form.description.trim() : null,
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg rounded-[20px] border backdrop-blur-md p-6"
				style={{
					background: "var(--surface-card-bg)",
					borderColor: "var(--surface-card-border)",
					boxShadow: "var(--surface-card-shadow)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-5 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-smile-title font-poppins">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="text-smile-description transition hover:text-smile-primary"
					>
						<Icon icon="lucide:x" width={18} />
					</button>
				</div>

				{error && (
					<div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
						<Icon icon="lucide:alert-circle" width={15} /> {error}
					</div>
				)}

				<form onSubmit={submit} className="flex flex-col gap-4">
					<Field label={t("schedule.workShiftModal.shiftNameLabel", "Shift name")}>
						<input
							className={inputCls}
							value={form.shift_name}
							maxLength={100}
							placeholder={t("schedule.workShiftModal.shiftNamePlaceholder", "Morning shift")}
							onChange={(e) => set("shift_name", e.target.value)}
						/>
					</Field>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label={t("schedule.workShiftModal.startTimeLabel", "Start time")}>
							<input
								type="time"
								className={inputCls}
								value={form.start_time}
								onChange={(e) => set("start_time", e.target.value)}
							/>
						</Field>
						<Field label={t("schedule.workShiftModal.endTimeLabel", "End time")}>
							<input
								type="time"
								className={inputCls}
								value={form.end_time}
								onChange={(e) => set("end_time", e.target.value)}
							/>
						</Field>
					</div>

					<Field label={t("schedule.workShiftModal.descriptionLabel", "Description")}>
						<textarea
							className={`${inputCls} h-auto min-h-[88px] resize-y py-3`}
							value={form.description ?? ""}
							placeholder={t("schedule.workShiftModal.descriptionPlaceholder", "Optional description")}
							onChange={(e) => set("description", e.target.value)}
						/>
					</Field>

					<div className="flex justify-end gap-3 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:opacity-80"
							style={{
								background: "var(--surface-panel-bg)",
								borderColor: "var(--surface-panel-border)",
							}}
						>
							{t("schedule.workShiftModal.cancel", "Cancel")}
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
							style={{
								background: BLUE,
								boxShadow: "0 0 15px rgba(146,205,253,0.3)",
							}}
						>
							{submitting && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							{t("schedule.workShiftModal.save", "Save")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default WorkShiftModal;
