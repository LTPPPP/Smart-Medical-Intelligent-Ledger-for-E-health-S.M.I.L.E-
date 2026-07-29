"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

const BLUE = "#92CDFD";

export interface SpecialtyFormValues {
	specialty_name: string;
	specialty_code: string;
	description?: string | null;
	display_order?: number | null;
	is_active: boolean;
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

export function SpecialtyModalDark({
	initial,
	submitting,
	title,
	onSubmit,
	onClose,
}: {
	initial?: Partial<SpecialtyFormValues>;
	submitting?: boolean;
	title: string;
	onSubmit: (v: SpecialtyFormValues) => void;
	onClose: () => void;
}) {
	const [form, setForm] = useState<SpecialtyFormValues>({
		specialty_name: "",
		specialty_code: "",
		description: "",
		display_order: null,
		is_active: true,
		...initial,
	});
	const [error, setError] = useState("");

	const set = <K extends keyof SpecialtyFormValues>(
		k: K,
		v: SpecialtyFormValues[K],
	) => setForm((f) => ({ ...f, [k]: v }));

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.specialty_name.trim() || !form.specialty_code.trim()) {
			setError("Specialty name and code are required.");
			return;
		}
		setError("");
		onSubmit({
			...form,
			specialty_name: form.specialty_name.trim(),
			specialty_code: form.specialty_code.trim(),
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
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="Specialty name">
							<input
								className={inputCls}
								value={form.specialty_name}
								placeholder="General Dentistry"
								onChange={(e) => set("specialty_name", e.target.value)}
							/>
						</Field>
						<Field label="Specialty code">
							<input
								className={inputCls}
								value={form.specialty_code}
								placeholder="GEN_DEN"
								onChange={(e) => set("specialty_code", e.target.value)}
							/>
						</Field>
						<Field label="Display order">
							<input
								type="number"
								className={inputCls}
								value={form.display_order ?? ""}
								placeholder="0"
								onChange={(e) =>
									set(
										"display_order",
										e.target.value ? Number(e.target.value) : null,
									)
								}
							/>
						</Field>
						<Field label="Status">
							<button
								type="button"
								onClick={() => set("is_active", !form.is_active)}
								className="flex h-11 items-center justify-between rounded-xl border px-4 text-sm text-smile-title transition [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
							>
								<span>{form.is_active ? "Active" : "Inactive"}</span>
								<span
									className="relative inline-flex h-5 w-9 items-center rounded-full transition"
									style={{
										background: form.is_active
											? BLUE
											: "rgba(255,255,255,0.15)",
									}}
								>
									<span
										className="inline-block h-4 w-4 rounded-full bg-white transition"
										style={{
											transform: form.is_active
												? "translateX(18px)"
												: "translateX(2px)",
										}}
									/>
								</span>
							</button>
						</Field>
					</div>

					<Field label="Description">
						<textarea
							className={`${inputCls} h-auto min-h-[88px] resize-y py-3`}
							value={form.description ?? ""}
							placeholder="Optional description"
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
							Cancel
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
							Save
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default SpecialtyModalDark;
