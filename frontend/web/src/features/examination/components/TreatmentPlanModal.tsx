"use client";

import { useState } from "react";

import { validateTreatmentPlanForm } from "@/features/examination/utils/treatmentPlanFlow";

import { Field, ModalShell, inputCls, areaCls } from "./modalKit";

export interface TreatmentPlanFormValues {
	plan_name?: string;
	objectives?: string;
	duration_weeks?: number | null;
	estimated_cost?: string;
	quote_currency?: string;
	quote_version?: string;
	risk_disclosure?: string;
	alternative_options?: string;
}

export function TreatmentPlanModal({
	initial,
	submitting,
	title,
	onSubmit,
	onClose,
}: {
	initial?: Partial<TreatmentPlanFormValues>;
	submitting?: boolean;
	title: string;
	onSubmit: (v: TreatmentPlanFormValues) => void;
	onClose: () => void;
}) {
	const [form, setForm] = useState<TreatmentPlanFormValues>({
		plan_name: "",
		objectives: "",
		duration_weeks: null,
		estimated_cost: "",
		quote_currency: "VND",
		quote_version: "",
		risk_disclosure: "",
		alternative_options: "",
		...initial,
	});
	const [error, setError] = useState("");
	const set = (k: keyof TreatmentPlanFormValues, v: string | number | null) =>
		setForm((f) => ({ ...f, [k]: v }));

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const validationError = validateTreatmentPlanForm(form);
		if (validationError) {
			setError(validationError);
			return;
		}
		setError("");
		onSubmit(form);
	};

	return (
		<ModalShell
			title={title}
			error={error}
			submitting={submitting}
			onClose={onClose}
			onSubmit={submit}
		>
			<Field label="Plan name">
				<input
					className={inputCls}
					value={form.plan_name ?? ""}
					placeholder="Orthodontic treatment plan"
					onChange={(e) => set("plan_name", e.target.value)}
				/>
			</Field>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field label="Duration (weeks)">
					<input
						type="number"
						min={1}
						className={inputCls}
						value={form.duration_weeks ?? ""}
						onChange={(e) =>
							set(
								"duration_weeks",
								e.target.value ? Number(e.target.value) : null,
							)
						}
					/>
				</Field>
				<Field label="Estimated cost">
					<input
						type="number"
						min={1}
						className={inputCls}
						value={form.estimated_cost ?? ""}
						placeholder="1200000"
						onChange={(e) => set("estimated_cost", e.target.value)}
					/>
				</Field>
			</div>
			<Field label="Currency">
				<input
					className={inputCls}
					value={form.quote_currency ?? "VND"}
					maxLength={3}
					onChange={(e) => set("quote_currency", e.target.value.toUpperCase())}
				/>
			</Field>
			<Field label="Quote version">
				<input
					className={inputCls}
					value={form.quote_version ?? ""}
					placeholder="PRICE-2026-07"
					onChange={(e) => set("quote_version", e.target.value)}
				/>
			</Field>
			<Field label="Risk disclosure">
				<textarea
					className={areaCls}
					value={form.risk_disclosure ?? ""}
					placeholder="Risks, expected discomfort, complications, and limits discussed..."
					onChange={(e) => set("risk_disclosure", e.target.value)}
				/>
			</Field>
			<Field label="Alternative options">
				<textarea
					className={areaCls}
					value={form.alternative_options ?? ""}
					placeholder="Alternative treatment options, observation, referral, or no treatment..."
					onChange={(e) => set("alternative_options", e.target.value)}
				/>
			</Field>
			<Field label="Objectives">
				<textarea
					className={areaCls}
					value={form.objectives ?? ""}
					placeholder="Goals of the treatment plan…"
					onChange={(e) => set("objectives", e.target.value)}
				/>
			</Field>
		</ModalShell>
	);
}

export default TreatmentPlanModal;
