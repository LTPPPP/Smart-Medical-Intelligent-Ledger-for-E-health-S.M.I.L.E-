"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import {
	CURRENCY_OPTIONS,
	DEFAULT_SERVICE_VALUES,
	DURATION_OPTIONS,
} from "@/features/service/constants/service.constant";
import { useSpecialties } from "@/features/service/hooks/useService";
import type {
	CreateServiceRequest,
	RoomType,
	Service,
	UpdateServiceRequest,
} from "@/features/service/types/service.type";

interface ServiceFormProps {
	service?: Service;
	onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => void;
	onCancel: () => void;
	isPending?: boolean;
}

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
	{ value: "examination", label: "Examination room" },
	{ value: "surgery", label: "Surgery room" },
	{ value: "imaging", label: "Imaging room" },
];

const labelClass = "mb-1.5 block text-sm font-semibold text-smile-title";
const inputClass =
	"h-11 w-full rounded-xl border px-3.5 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]";

export const ServiceForm = ({
	service,
	onSubmit,
	onCancel,
	isPending = false,
}: ServiceFormProps) => {
	const isEditMode = Boolean(service);
	const { data: specialties, isLoading: isLoadingSpecialties } = useSpecialties(
		{ isActive: true },
	);

	const [formData, setFormData] = useState<CreateServiceRequest>({
		serviceName: service?.serviceName ?? "",
		serviceCode: service?.serviceCode ?? "",
		categoryId: service?.categoryId ?? null,
		specialtyId: service?.specialtyId ?? "",
		description: service?.description ?? "",
		durationMinutes:
			service?.durationMinutes ?? DEFAULT_SERVICE_VALUES.durationMinutes,
		requiredRoomType: service?.requiredRoomType ?? "examination",
		basePrice: service?.basePrice ?? 0,
		currency: service?.currency ?? DEFAULT_SERVICE_VALUES.currency,
		requiresAppointment:
			service?.requiresAppointment ??
			DEFAULT_SERVICE_VALUES.requiresAppointment,
		preparationInstructions: service?.preparationInstructions ?? "",
	});
	const [isActive, setIsActive] = useState(service?.isActive ?? true);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const nextErrors: Record<string, string> = {};

		if (!formData.serviceName.trim()) {
			nextErrors.serviceName = "Service name is required";
		}
		if (!isEditMode && !formData.serviceCode.trim()) {
			nextErrors.serviceCode = "Service code is required";
		}
		if (!formData.specialtyId) {
			nextErrors.specialtyId = "Specialty is required";
		}
		if (!formData.requiredRoomType) {
			nextErrors.requiredRoomType = "Room type is required";
		}
		if (
			formData.basePrice === null ||
			formData.basePrice === undefined ||
			!Number.isFinite(formData.basePrice) ||
			formData.basePrice <= 0
		) {
			nextErrors.basePrice = "Price must be greater than 0";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const clearError = (field: string) => {
		if (!errors[field]) return;
		setErrors((previous) => {
			const next = { ...previous };
			delete next[field];
			return next;
		});
	};

	const handleChange = <K extends keyof CreateServiceRequest>(
		field: K,
		value: CreateServiceRequest[K],
	) => {
		setFormData((previous) => ({ ...previous, [field]: value }));
		clearError(field);
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!validate()) return;

		if (isEditMode) {
			const updateData: UpdateServiceRequest = {
				serviceName: formData.serviceName,
				categoryId: formData.categoryId,
				specialtyId: formData.specialtyId,
				description: formData.description,
				durationMinutes: formData.durationMinutes,
				requiredRoomType: formData.requiredRoomType,
				basePrice: formData.basePrice,
				requiresAppointment: formData.requiresAppointment,
				preparationInstructions: formData.preparationInstructions,
				isActive,
			};
			onSubmit(updateData);
			return;
		}

		onSubmit(formData);
	};

	const currencySymbol =
		CURRENCY_OPTIONS.find((option) => option.value === formData.currency)
			?.symbol ?? "";

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className={isEditMode ? "" : "grid gap-5 sm:grid-cols-2"}>
				<div>
					<label htmlFor="service-name" className={labelClass}>
						Service name <span className="text-red-500">*</span>
					</label>
					<input
						id="service-name"
						type="text"
						value={formData.serviceName}
						onChange={(event) =>
							handleChange("serviceName", event.target.value)
						}
						aria-invalid={Boolean(errors.serviceName)}
						className={`${inputClass} ${
							errors.serviceName ? "!border-red-500" : ""
						}`}
						placeholder="General Dental Examination"
					/>
					{errors.serviceName && (
						<p className="mt-1.5 text-sm text-red-600">{errors.serviceName}</p>
					)}
				</div>

				{!isEditMode && (
					<div>
						<label htmlFor="service-code" className={labelClass}>
							Service code <span className="text-red-500">*</span>
						</label>
						<input
							id="service-code"
							type="text"
							value={formData.serviceCode}
							onChange={(event) =>
								handleChange("serviceCode", event.target.value.toUpperCase())
							}
							aria-invalid={Boolean(errors.serviceCode)}
							className={`${inputClass} font-mono uppercase ${
								errors.serviceCode ? "!border-red-500" : ""
							}`}
							placeholder="EXAM-01"
							maxLength={50}
						/>
						{errors.serviceCode && (
							<p className="mt-1.5 text-sm text-red-600">
								{errors.serviceCode}
							</p>
						)}
					</div>
				)}
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<div>
					<label htmlFor="service-specialty" className={labelClass}>
						Specialty <span className="text-red-500">*</span>
					</label>
					<select
						id="service-specialty"
						value={formData.specialtyId ?? ""}
						onChange={(event) =>
							handleChange("specialtyId", event.target.value)
						}
						disabled={isLoadingSpecialties}
						aria-invalid={Boolean(errors.specialtyId)}
						className={`${inputClass} ${
							errors.specialtyId ? "!border-red-500" : ""
						}`}
					>
						<option value="">
							{isLoadingSpecialties
								? "Loading specialties…"
								: "Select specialty"}
						</option>
						{specialties?.map((specialty) => (
							<option key={specialty.specialtyId} value={specialty.specialtyId}>
								{specialty.specialtyName}
							</option>
						))}
					</select>
					{errors.specialtyId && (
						<p className="mt-1.5 text-sm text-red-600">{errors.specialtyId}</p>
					)}
				</div>

				<div>
					<label htmlFor="service-room-type" className={labelClass}>
						Required room <span className="text-red-500">*</span>
					</label>
					<select
						id="service-room-type"
						value={formData.requiredRoomType}
						onChange={(event) =>
							handleChange("requiredRoomType", event.target.value as RoomType)
						}
						aria-invalid={Boolean(errors.requiredRoomType)}
						className={`${inputClass} ${
							errors.requiredRoomType ? "!border-red-500" : ""
						}`}
					>
						{ROOM_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					{errors.requiredRoomType && (
						<p className="mt-1.5 text-sm text-red-600">
							{errors.requiredRoomType}
						</p>
					)}
				</div>
			</div>

			<div>
				<label htmlFor="service-description" className={labelClass}>
					Description
				</label>
				<textarea
					id="service-description"
					value={formData.description ?? ""}
					onChange={(event) => handleChange("description", event.target.value)}
					className="min-h-24 w-full resize-y rounded-xl border px-3.5 py-3 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					placeholder="Describe the treatment and its purpose."
				/>
			</div>

			<div className="grid gap-5 sm:grid-cols-3">
				<div>
					<label htmlFor="service-duration" className={labelClass}>
						Duration
					</label>
					<select
						id="service-duration"
						value={
							formData.durationMinutes ?? DEFAULT_SERVICE_VALUES.durationMinutes
						}
						onChange={(event) =>
							handleChange("durationMinutes", Number(event.target.value))
						}
						className={inputClass}
					>
						{DURATION_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="service-currency" className={labelClass}>
						Currency
					</label>
					<select
						id="service-currency"
						value={formData.currency}
						onChange={(event) => handleChange("currency", event.target.value)}
						disabled={isEditMode}
						className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
					>
						{CURRENCY_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="service-price" className={labelClass}>
						Base price <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-smile-description">
							{currencySymbol}
						</span>
						<input
							id="service-price"
							type="number"
							value={formData.basePrice || ""}
							onChange={(event) =>
								handleChange(
									"basePrice",
									event.target.value ? Number(event.target.value) : 0,
								)
							}
							aria-invalid={Boolean(errors.basePrice)}
							className={`${inputClass} pl-10 ${
								errors.basePrice ? "!border-red-500" : ""
							}`}
							placeholder="0"
							min={0}
							step={formData.currency === "VND" ? 1000 : 0.01}
						/>
					</div>
					{errors.basePrice && (
						<p className="mt-1.5 text-sm text-red-600">{errors.basePrice}</p>
					)}
				</div>
			</div>

			<div>
				<label htmlFor="service-preparation" className={labelClass}>
					Preparation instructions
				</label>
				<textarea
					id="service-preparation"
					value={formData.preparationInstructions ?? ""}
					onChange={(event) =>
						handleChange("preparationInstructions", event.target.value)
					}
					className="min-h-24 w-full resize-y rounded-xl border px-3.5 py-3 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					placeholder="Add any instructions patients should follow."
				/>
			</div>

			<div className="flex flex-wrap gap-5 rounded-xl border p-4 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
				<label className="inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm font-semibold text-smile-title">
					<input
						type="checkbox"
						checked={formData.requiresAppointment ?? true}
						onChange={(event) =>
							handleChange("requiresAppointment", event.target.checked)
						}
						className="h-4 w-4 rounded border-slate-300 text-smile-primary focus:ring-smile-primary"
					/>
					Requires appointment
				</label>

				{isEditMode && (
					<label className="inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm font-semibold text-smile-title">
						<input
							type="checkbox"
							checked={isActive}
							onChange={(event) => setIsActive(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300 text-smile-primary focus:ring-smile-primary"
						/>
						Active
					</label>
				)}
			</div>

			<div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end [border-color:var(--surface-panel-border)]">
				<button
					type="button"
					onClick={onCancel}
					disabled={isPending}
					className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-smile-primary px-5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPending && <Icon icon="line-md:loading-twotone-loop" width={17} />}
					{isPending
						? isEditMode
							? "Updating…"
							: "Creating…"
						: isEditMode
							? "Update Service"
							: "Create Service"}
				</button>
			</div>
		</form>
	);
};
