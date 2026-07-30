"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

export interface SpecialtyFormValues {
	specialty_name: string;
	specialty_code: string;
	description?: string | null;
	is_active: boolean;
	clinic_ids: string[];
}

interface Clinic {
	clinic_id: string;
	clinic_name: string;
}

function unwrapArr<T>(res: unknown): T[] {
	const payload = (res as { data?: unknown })?.data;
	if (Array.isArray(payload)) return payload as T[];
	const inner = (payload as { data?: unknown })?.data;
	return Array.isArray(inner) ? (inner as T[]) : [];
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
		is_active: true,
		clinic_ids: [],
		...initial,
	});
	const [error, setError] = useState("");

	const { data: clinicsRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);

	const set = <K extends keyof SpecialtyFormValues>(
		k: K,
		v: SpecialtyFormValues[K],
	) => setForm((f) => ({ ...f, [k]: v }));

	const toggleClinic = (clinicId: string) => {
		setForm((f) => ({
			...f,
			clinic_ids: f.clinic_ids.includes(clinicId)
				? f.clinic_ids.filter((id) => id !== clinicId)
				: [...f.clinic_ids, clinicId],
		}));
	};

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
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg overflow-hidden rounded-[24px] border shadow-2xl"
				style={{
					background: "var(--surface-card-bg)",
					borderColor: "var(--surface-card-border)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between bg-gradient-to-r from-smile-primary to-smile-primary-dark px-6 py-5">
					<h3 className="font-poppins text-lg font-semibold text-white">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
					>
						<Icon icon="lucide:x" width={18} />
					</button>
				</div>

				<form onSubmit={submit} className="flex flex-col gap-4 p-6">
					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-500 dark:text-red-300">
							<Icon icon="lucide:alert-circle" width={15} /> {error}
						</div>
					)}

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
					</div>

					<Field label="Status">
						<button
							type="button"
							onClick={() => set("is_active", !form.is_active)}
							className="flex h-11 items-center justify-between rounded-xl border px-4 text-sm text-smile-title transition [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
						>
							<span>{form.is_active ? "Active" : "Inactive"}</span>
							<span
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${form.is_active ? "bg-smile-primary" : "bg-smile-description/30"}`}
							>
								<span
									className="inline-block h-4 w-4 rounded-full bg-white shadow transition"
									style={{
										transform: form.is_active
											? "translateX(18px)"
											: "translateX(2px)",
									}}
								/>
							</span>
						</button>
					</Field>

					<Field label="Description">
						<textarea
							className={`${inputCls} h-auto min-h-[80px] resize-y py-3`}
							value={form.description ?? ""}
							placeholder="Optional description"
							onChange={(e) => set("description", e.target.value)}
						/>
					</Field>

					<Field label="Offered at clinics">
						{clinics.length === 0 ? (
							<p className="text-sm text-smile-description">
								No clinics found.
							</p>
						) : (
							<div className="flex flex-col gap-2 rounded-xl border p-3 [border-color:var(--surface-panel-border)]">
								{clinics.map((c) => {
									const checked = form.clinic_ids.includes(c.clinic_id);
									return (
										<label
											key={c.clinic_id}
											className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-smile-title transition hover:bg-smile-primary-light/40"
										>
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleClinic(c.clinic_id)}
												className="h-4 w-4 accent-smile-primary"
											/>
											{c.clinic_name}
										</label>
									);
								})}
							</div>
						)}
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
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark disabled:opacity-60"
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
