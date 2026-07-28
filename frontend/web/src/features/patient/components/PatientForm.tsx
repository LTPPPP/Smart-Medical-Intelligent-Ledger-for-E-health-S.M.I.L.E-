"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { GENDER, GENDER_OPTIONS } from "@/shared/constants/common";
import { FIELD_LIMITS } from "@/shared/constants/field-limits";
import { collectErrors, patientFormSchema } from "@/shared/lib/validators";

import { usePatient } from "../hooks/usePatient";
import type { Patient } from "../types/patient.type";

interface PatientFormProps {
	patient?: Patient;
	onSuccess: (result: { id: string }) => void;
	onCancel: () => void;
}

type FormData = {
	full_name: string;
	date_of_birth: string;
	/** ISO 5218 code held as a string, because that is what a <select> yields. */
	gender: string;
	phone: string;
	email: string;
	address: string;
	insurance_number: string;
	insurance_provider: string;
	emergency_contact_name: string;
	emergency_contact_phone: string;
	emergency_contact_relationship: string;
	allergies_raw: string;
};

function toFormData(patient?: Patient): FormData {
	return {
		full_name: patient?.fullName ?? "",
		date_of_birth: patient?.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
		gender: String(patient?.gender ?? GENDER.MALE),
		phone: patient?.phone ?? "",
		email: patient?.email ?? "",
		address: patient?.address ?? "",
		insurance_number: patient?.insuranceNumber ?? "",
		insurance_provider: patient?.insuranceProvider ?? "",
		emergency_contact_name: patient?.emergencyContact?.name ?? "",
		emergency_contact_phone: patient?.emergencyContact?.phone ?? "",
		emergency_contact_relationship:
			patient?.emergencyContact?.relationship ?? "",
		allergies_raw: (patient?.allergies ?? []).join(", "),
	};
}

const inputClass =
	"w-full min-h-[2.75rem] px-4 bg-slate-100 border border-slate-200 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-teal-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_0_0_3px_rgba(14,140,128,0.2)] text-sm transition-all";
const inputErrorClass =
	"w-full min-h-[2.75rem] px-4 bg-slate-100 border border-red-400 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-red-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_0_0_3px_rgba(239,68,68,0.2)] text-sm transition-all";
const labelClass =
	"block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1";

export function PatientForm({
	patient,
	onSuccess,
	onCancel,
}: PatientFormProps) {
	const isEdit = !!patient;
	const { createPatient, updatePatient, isCreatingPatient, isUpdatingPatient } =
		usePatient();
	const [form, setForm] = useState<FormData>(() => toFormData(patient));
	const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
		{},
	);

	const set = (key: keyof FormData, val: string) =>
		setForm((f) => ({ ...f, [key]: val }));

	const validate = (): boolean => {
		// Schema-driven: enforces every column width and the gender code set, not
		// just the three presence checks this used to do.
		const errs = collectErrors(patientFormSchema, form) as Partial<
			Record<keyof FormData, string>
		>;
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		const allergies = form.allergies_raw
			? form.allergies_raw
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const hasEmergencyContact =
			form.emergency_contact_name || form.emergency_contact_phone;

		const body: Record<string, unknown> = {
			full_name: form.full_name,
			date_of_birth: form.date_of_birth,
			gender: Number(form.gender),
			phone: form.phone,
			email: form.email || undefined,
			address: form.address || undefined,
			insurance_number: form.insurance_number || undefined,
			insurance_provider: form.insurance_provider || undefined,
			allergies: allergies.length > 0 ? allergies : undefined,
			emergency_contact: hasEmergencyContact
				? {
						name: form.emergency_contact_name,
						phone: form.emergency_contact_phone,
						relationship: form.emergency_contact_relationship,
					}
				: undefined,
		};

		try {
			if (isEdit && patient) {
				await updatePatient({ id: patient.id, body });
				onSuccess({ id: patient.id });
			} else {
				const result = await createPatient(body);
				onSuccess({ id: result.data.id });
			}
		} catch (err) {
			console.error("PatientForm submit error:", err);
		}
	};

	const isPending = isCreatingPatient || isUpdatingPatient;

	const field = (
		label: string,
		key: keyof FormData,
		opts?: {
			type?: string;
			required?: boolean;
			placeholder?: string;
			as?: "select";
			options?: { value: string; label: string }[];
			/** Column width from FIELD_LIMITS; stops over-long input at the keyboard. */
			maxLength?: number;
		},
	) => (
		<div>
			<label className={labelClass}>
				{label}
				{opts?.required && <span className="text-red-400 ml-1">*</span>}
			</label>
			{opts?.as === "select" ? (
				<select
					value={form[key]}
					onChange={(e) => set(key, e.target.value)}
					className={errors[key] ? inputErrorClass : inputClass}
				>
					{opts.options?.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			) : (
				<input
					type={opts?.type ?? "text"}
					value={form[key]}
					maxLength={opts?.maxLength}
					placeholder={opts?.placeholder}
					onChange={(e) => set(key, e.target.value)}
					className={errors[key] ? inputErrorClass : inputClass}
				/>
			)}
			{errors[key] && (
				<p className="text-red-500 text-xs mt-1 flex items-center gap-1">
					<Icon icon="mdi:alert-circle-outline" width={12} />
					{errors[key]}
				</p>
			)}
		</div>
	);

	const SectionCard = ({
		icon,
		iconColor,
		title,
		children,
	}: {
		icon: string;
		iconColor: string;
		title: string;
		children: React.ReactNode;
	}) => (
		<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
			<h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2.5">
				<span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-none">
					<Icon icon={icon} width={18} className={iconColor} />
				</span>
				{title}
			</h3>
			{children}
		</div>
	);

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{/* Basic Info */}
			<SectionCard
				icon="mdi:account"
				iconColor="text-teal-600"
				title="Basic Information"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{field("Full Name", "full_name", {
						required: true,
						placeholder: "Nguyễn Văn A",
						maxLength: FIELD_LIMITS.fullName,
					})}
					{field("Date of Birth", "date_of_birth", {
						type: "date",
						required: true,
					})}
					{field("Gender", "gender", {
						as: "select",
						options: GENDER_OPTIONS.map((o) => ({
							value: String(o.value),
							label: o.label,
						})),
					})}
					{field("Phone Number", "phone", {
						required: true,
						placeholder: "0912 345 678",
						maxLength: FIELD_LIMITS.phone,
					})}
					{field("Email", "email", {
						type: "email",
						placeholder: "example@email.com",
						maxLength: FIELD_LIMITS.email,
					})}
					<div className="md:col-span-2">
						{field("Address", "address", {
							placeholder: "123 ABC Street, District 1, Ho Chi Minh City",
							maxLength: FIELD_LIMITS.address,
						})}
					</div>
				</div>
			</SectionCard>

			{/* Insurance */}
			<SectionCard
				icon="mdi:shield-check"
				iconColor="text-teal-600"
				title="Health Insurance"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{field("Insurance Card Number", "insurance_number", {
						placeholder: "DN4123456789",
						maxLength: FIELD_LIMITS.insuranceNumber,
					})}
					{field("Provider", "insurance_provider", {
						placeholder: "State Health Insurance",
						maxLength: FIELD_LIMITS.insuranceProvider,
					})}
				</div>
			</SectionCard>

			{/* Emergency Contact */}
			<SectionCard
				icon="mdi:phone-alert"
				iconColor="text-teal-600"
				title="Emergency Contact"
			>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{field("Full Name", "emergency_contact_name", {
						placeholder: "Nguyễn Thị B",
						maxLength: FIELD_LIMITS.emergencyContact,
					})}
					{field("Phone Number", "emergency_contact_phone", {
						placeholder: "0901 234 567",
						maxLength: FIELD_LIMITS.phone,
					})}
					{field("Relationship", "emergency_contact_relationship", {
						placeholder: "Spouse / Parent / Child",
						maxLength: FIELD_LIMITS.relationship,
					})}
				</div>
			</SectionCard>

			{/* Allergies */}
			<SectionCard
				icon="mdi:alert-circle"
				iconColor="text-teal-600"
				title="Allergies"
			>
				<div>
					<label className={labelClass}>Allergy list (comma-separated)</label>
					<input
						type="text"
						placeholder="e.g.: Penicillin, Aspirin, Seafood..."
						value={form.allergies_raw}
						onChange={(e) => set("allergies_raw", e.target.value)}
						className={inputClass}
					/>
				</div>
			</SectionCard>

			{/* Actions */}
			<div className="flex gap-3 justify-end pt-1">
				<button
					type="button"
					onClick={onCancel}
					className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[2.75rem] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[2.75rem] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
				>
					{isPending && <Icon icon="line-md:loading-twotone-loop" width={18} />}
					{isEdit ? "Update" : "Create Profile"}
				</button>
			</div>
		</form>
	);
}
