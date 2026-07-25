"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

export interface ClinicFormValues {
	clinic_name: string;
	clinic_code: string;
	address: string;
	ward?: string;
	district?: string;
	city?: string;
	phone?: string;
	email?: string;
	website?: string;
}

const EMPTY: ClinicFormValues = {
	clinic_name: "",
	clinic_code: "",
	address: "",
	ward: "",
	district: "",
	city: "",
	phone: "",
	email: "",
	website: "",
};

function Field({
	label,
	value,
	onChange,
	required,
	type = "text",
	placeholder,
	colSpan,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	required?: boolean;
	type?: string;
	placeholder?: string;
	colSpan?: boolean;
}) {
	return (
		<label
			className={`flex flex-col gap-1.5 ${colSpan ? "sm:col-span-2" : ""}`}
		>
			<span className="font-inter text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
				{required && <span className="text-smile-primary"> *</span>}
			</span>
			<input
				type={type}
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				className="h-11 w-full rounded-xl border px-4 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
			/>
		</label>
	);
}

export function ClinicFormDark({
	initial,
	submitting,
	submitLabel,
	onSubmit,
	onCancel,
}: {
	initial?: Partial<ClinicFormValues>;
	submitting?: boolean;
	submitLabel: string;
	onSubmit: (values: ClinicFormValues) => void;
	onCancel?: () => void;
}) {
	const [form, setForm] = useState<ClinicFormValues>({ ...EMPTY, ...initial });
	const [error, setError] = useState("");
	const set = (k: keyof ClinicFormValues) => (v: string) =>
		setForm((f) => ({ ...f, [k]: v }));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!form.clinic_name.trim() ||
			!form.clinic_code.trim() ||
			!form.address.trim()
		) {
			setError("Name, code and address are required.");
			return;
		}
		setError("");
		onSubmit(form);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{error && (
				<div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
					<Icon icon="lucide:alert-circle" width={16} /> {error}
				</div>
			)}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field
					label="Clinic name"
					value={form.clinic_name}
					onChange={set("clinic_name")}
					required
					placeholder="Nha Khoa S.M.I.L.E - …"
				/>
				<Field
					label="Clinic code"
					value={form.clinic_code}
					onChange={set("clinic_code")}
					required
					placeholder="SMILE-XX"
				/>
				<Field
					label="Address"
					value={form.address}
					onChange={set("address")}
					required
					placeholder="Street, ward"
					colSpan
				/>
				<Field label="Ward" value={form.ward ?? ""} onChange={set("ward")} />
				<Field
					label="District"
					value={form.district ?? ""}
					onChange={set("district")}
				/>
				<Field label="City" value={form.city ?? ""} onChange={set("city")} />
				<Field
					label="Phone"
					value={form.phone ?? ""}
					onChange={set("phone")}
					placeholder="024-…"
				/>
				<Field
					label="Email"
					type="email"
					value={form.email ?? ""}
					onChange={set("email")}
					placeholder="clinic@smile.vn"
				/>
				<Field
					label="Website"
					value={form.website ?? ""}
					onChange={set("website")}
					placeholder="https://…"
					colSpan
				/>
			</div>
			<div className="flex justify-end gap-3">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="rounded-full border border-smile-primary/20 px-5 py-3 text-sm font-semibold text-smile-description transition hover:border-smile-primary/40 hover:text-smile-title [background:var(--surface-input-bg)]"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					disabled={submitting}
					className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
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

export default ClinicFormDark;
