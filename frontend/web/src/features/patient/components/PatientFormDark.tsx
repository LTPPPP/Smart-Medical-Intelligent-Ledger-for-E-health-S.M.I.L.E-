"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { BookingDatePicker } from "@/features/appointment/components/BookingDateTimeFields";
import { useTranslation } from "@/features/i18n";
import { EMAIL_REGEX, GENDER_OPTIONS, PHONE_REGEX } from "@/shared/constants/common";
import { FIELD_LIMITS } from "@/shared/constants/field-limits";

const BLUE = "#92CDFD";

export interface PatientFormValues {
	patient_code?: string;
	full_name: string;
	date_of_birth?: string;
	gender?: string;
	phone?: string;
	email?: string;
	address?: string;
	allergies?: string[];
	chronic_diseases?: string[];
}

interface FormState {
	patient_code: string;
	full_name: string;
	date_of_birth: string;
	gender: string;
	phone: string;
	email: string;
	address: string;
	allergies_raw: string;
	chronic_diseases_raw: string;
}

const EMPTY: FormState = {
	patient_code: "",
	full_name: "",
	date_of_birth: "",
	gender: "",
	phone: "",
	email: "",
	address: "",
	allergies_raw: "",
	chronic_diseases_raw: "",
};

const toFormState = (v?: Partial<PatientFormValues>): FormState => ({
	patient_code: v?.patient_code ?? "",
	full_name: v?.full_name ?? "",
	date_of_birth: v?.date_of_birth ?? "",
	gender: v?.gender ?? "",
	phone: v?.phone ?? "",
	email: v?.email ?? "",
	address: v?.address ?? "",
	allergies_raw: (v?.allergies ?? []).join(", "),
	chronic_diseases_raw: (v?.chronic_diseases ?? []).join(", "),
});

const splitList = (raw: string): string[] =>
	raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

const inputCls =
	"h-11 rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";
const inputStyle = {
	background: "var(--surface-input-bg)",
	borderColor: "var(--surface-input-border)",
};

function Label({
	label,
	required,
	error,
	children,
	colSpan,
}: {
	label: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
	colSpan?: boolean;
}) {
	return (
		<label className={`flex flex-col gap-1.5 ${colSpan ? "sm:col-span-2" : ""}`}>
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
				{required && <span className="text-[#38BDF8]"> *</span>}
			</span>
			{children}
			{error && (
				<span className="flex items-center gap-1 text-xs text-red-400">
					<Icon icon="lucide:alert-circle" width={12} /> {error}
				</span>
			)}
		</label>
	);
}

export function PatientFormDark({
	initial,
	submitting,
	submitLabel,
	onSubmit,
	onCancel,
}: {
	initial?: Partial<PatientFormValues>;
	submitting?: boolean;
	submitLabel: string;
	onSubmit: (values: PatientFormValues) => void;
	onCancel?: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState<FormState>(() => ({
		...EMPTY,
		...toFormState(initial),
	}));
	const [errors, setErrors] = useState<Record<string, string>>({});
	const set = (k: keyof FormState) => (v: string) => {
		setForm((f) => ({ ...f, [k]: v }));
		setErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
	};

	const validate = (): Record<string, string> => {
		const next: Record<string, string> = {};
		if (!form.full_name.trim()) {
			next.full_name = t("patients.form.fullNameRequired", "Full name is required.");
		}
		if (form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) {
			next.phone = t(
				"patients.form.phoneInvalid",
				"Phone number must be exactly 10 digits.",
			);
		}
		if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
			next.email = t("patients.form.emailInvalid", "Enter a valid email address.");
		}
		return next;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const nextErrors = validate();
		setErrors(nextErrors);
		if (Object.values(nextErrors).some(Boolean)) return;

		const values: PatientFormValues = {
			full_name: form.full_name.trim(),
			date_of_birth: form.date_of_birth || undefined,
			gender: form.gender || undefined,
			phone: form.phone.trim() || undefined,
			email: form.email.trim() || undefined,
			address: form.address.trim() || undefined,
			allergies: splitList(form.allergies_raw),
			chronic_diseases: splitList(form.chronic_diseases_raw),
		};
		if (form.patient_code) values.patient_code = form.patient_code;
		onSubmit(values);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{initial?.patient_code && (
					<Label label={t("patients.form.patientCode", "Patient code")}>
						<input
							className={`${inputCls} cursor-not-allowed opacity-70`}
							style={inputStyle}
							value={form.patient_code}
							readOnly
						/>
					</Label>
				)}
				<Label
					label={t("patients.form.fullName", "Full name")}
					required
					error={errors.full_name}
				>
					<input
						className={inputCls}
						style={inputStyle}
						value={form.full_name}
						maxLength={FIELD_LIMITS.fullName}
						placeholder="Nguyễn Văn A"
						onChange={(e) => set("full_name")(e.target.value)}
					/>
				</Label>
				<Label label={t("patients.form.dateOfBirth", "Date of birth")}>
					<BookingDatePicker
						value={form.date_of_birth}
						onChange={set("date_of_birth")}
						maxDate={new Date()}
					/>
				</Label>
				<Label label={t("patients.form.gender", "Gender")}>
					<select
						className={inputCls}
						style={inputStyle}
						value={form.gender}
						onChange={(e) => set("gender")(e.target.value)}
					>
						<option value="" style={{ background: "var(--surface-input-bg)" }}>
							— {t("patients.form.selectPlaceholder", "select")} —
						</option>
						{GENDER_OPTIONS.map((g) => (
							<option
								key={g.value}
								value={String(g.value)}
								style={{ background: "var(--surface-input-bg)" }}
							>
								{g.label}
							</option>
						))}
					</select>
				</Label>
				<Label
					label={t("patients.form.phone", "Phone")}
					error={errors.phone}
				>
					<input
						className={inputCls}
						style={inputStyle}
						value={form.phone}
						inputMode="numeric"
						maxLength={10}
						placeholder="09xxxxxxxx"
						onChange={(e) => set("phone")(e.target.value.replace(/\D/g, ""))}
					/>
				</Label>
				<Label
					label={t("patients.form.email", "Email")}
					error={errors.email}
				>
					<input
						type="email"
						className={inputCls}
						style={inputStyle}
						value={form.email}
						maxLength={FIELD_LIMITS.email}
						placeholder="patient@email.com"
						onChange={(e) => set("email")(e.target.value)}
					/>
				</Label>
				<Label label={t("patients.form.address", "Address")} colSpan>
					<input
						className={inputCls}
						style={inputStyle}
						value={form.address}
						maxLength={FIELD_LIMITS.address}
						placeholder="Street, ward, district, city"
						onChange={(e) => set("address")(e.target.value)}
					/>
				</Label>
				<Label label={t("patients.form.allergies", "Allergies")} colSpan>
					<textarea
						className={`${inputCls} h-20 resize-none py-2.5`}
						style={inputStyle}
						value={form.allergies_raw}
						maxLength={FIELD_LIMITS.notes}
						placeholder={t(
							"patients.form.allergiesPlaceholder",
							"Penicillin, latex… (comma-separated)",
						)}
						onChange={(e) => set("allergies_raw")(e.target.value)}
					/>
				</Label>
				<Label label={t("patients.form.chronicDiseases", "Chronic diseases")} colSpan>
					<textarea
						className={`${inputCls} h-20 resize-none py-2.5`}
						style={inputStyle}
						value={form.chronic_diseases_raw}
						maxLength={FIELD_LIMITS.notes}
						placeholder={t(
							"patients.form.chronicDiseasesPlaceholder",
							"Diabetes, hypertension… (comma-separated)",
						)}
						onChange={(e) => set("chronic_diseases_raw")(e.target.value)}
					/>
				</Label>
			</div>
			<div className="flex justify-end gap-3">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="rounded-full border px-5 py-3 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
						style={{
							background: "var(--surface-panel-bg)",
							borderColor: "var(--surface-panel-border)",
						}}
					>
						{t("common.cancel", "Cancel")}
					</button>
				)}
				<button
					type="submit"
					disabled={submitting}
					className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
					style={{
						background: BLUE,
						boxShadow: "0 0 15px rgba(146,205,253,0.3)",
					}}
				>
					{submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />}
					{submitLabel}
				</button>
			</div>
		</form>
	);
}

export default PatientFormDark;
