"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import {
	SPECIALTY_ICONS,
	DEFAULT_SPECIALTY_VALUES,
} from "@/features/service/constants/service.constant";
import type {
	Specialty,
	CreateSpecialtyRequest,
	UpdateSpecialtyRequest,
} from "@/features/service/types/service.type";

interface SpecialtyFormProps {
	specialty?: Specialty;
	onSubmit: (data: CreateSpecialtyRequest | UpdateSpecialtyRequest) => void;
	onCancel: () => void;
	isPending?: boolean;
}

export const SpecialtyForm = ({
	specialty,
	onSubmit,
	onCancel,
	isPending = false,
}: SpecialtyFormProps) => {
	const isEditMode = !!specialty;

	const [formData, setFormData] = useState<
		CreateSpecialtyRequest | UpdateSpecialtyRequest
	>({
		specialtyName: specialty?.specialtyName || "",
		specialtyCode: specialty?.specialtyCode || "",
		description: specialty?.description || "",
		iconUrl: specialty?.iconUrl || "",
		displayOrder:
			specialty?.displayOrder || DEFAULT_SPECIALTY_VALUES.displayOrder,
		...(isEditMode && { isActive: specialty.isActive }),
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.specialtyName?.trim()) {
			newErrors.specialtyName = "Specialty name is required";
		}

		if (
			!isEditMode &&
			!(formData as CreateSpecialtyRequest).specialtyCode?.trim()
		) {
			newErrors.specialtyCode = "Specialty code is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		onSubmit(formData);
	};

	const handleChange = (field: string, value: string | number | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear Error
		if (errors[field]) {
			setErrors((prev) => {
				const rest = { ...prev };
				delete rest[field];
				return rest;
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Specialty Name */}
			<div>
				<label className="mb-2 block text-sm font-medium text-gray-700">
					Specialty Name <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					value={formData.specialtyName || ""}
					onChange={(e) => handleChange("specialtyName", e.target.value)}
					className={`w-full rounded-md border px-4 py-2 focus:border-blue-500 focus:outline-none ${
						errors.specialtyName ? "border-red-500" : "border-gray-300"
					}`}
					placeholder="e.g. Orthodontics"
				/>
				{errors.specialtyName && (
					<p className="mt-1 text-sm text-red-500">{errors.specialtyName}</p>
				)}
			</div>

			{/* Specialty Code */}
			{!isEditMode && (
				<div>
					<label className="mb-2 block text-sm font-medium text-gray-700">
						Specialty Code <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={(formData as CreateSpecialtyRequest).specialtyCode || ""}
						onChange={(e) =>
							handleChange("specialtyCode", e.target.value.toUpperCase())
						}
						className={`w-full rounded-md border px-4 py-2 font-mono uppercase focus:border-blue-500 focus:outline-none ${
							errors.specialtyCode ? "border-red-500" : "border-gray-300"
						}`}
						placeholder="e.g. ORTHO"
						maxLength={20}
					/>
					{errors.specialtyCode && (
						<p className="mt-1 text-sm text-red-500">{errors.specialtyCode}</p>
					)}
				</div>
			)}

			{/* Description */}
			<div>
				<label className="mb-2 block text-sm font-medium text-gray-700">
					Description
				</label>
				<textarea
					value={formData.description || ""}
					onChange={(e) => handleChange("description", e.target.value)}
					className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
					rows={3}
					placeholder="Brief description of the specialty..."
				/>
			</div>

			{/* Icon Selection */}
			<div>
				<label className="mb-2 block text-sm font-medium text-gray-700">
					Icon
				</label>
				<div className="grid grid-cols-6 gap-2">
					{Object.entries(SPECIALTY_ICONS).map(([key, iconName]) => (
						<button
							key={key}
							type="button"
							onClick={() => handleChange("iconUrl", iconName)}
							className={`flex h-12 w-12 items-center justify-center rounded-md border-2 transition-all ${
								formData.iconUrl === iconName
									? "border-blue-500 bg-blue-50"
									: "border-gray-300 bg-white hover:border-blue-300"
							}`}
						>
							<Icon icon={iconName} className="text-2xl text-gray-700" />
						</button>
					))}
				</div>
			</div>

			{/* Display Order */}
			<div>
				<label className="mb-2 block text-sm font-medium text-gray-700">
					Display Order
				</label>
				<input
					type="number"
					value={formData.displayOrder || DEFAULT_SPECIALTY_VALUES.displayOrder}
					onChange={(e) =>
						handleChange("displayOrder", parseInt(e.target.value))
					}
					className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
					min={0}
				/>
				<p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
			</div>

			{/* Active Status */}
			{isEditMode && (
				<div className="flex items-center gap-3">
					<input
						type="checkbox"
						id="isActive"
						checked={
							(formData as UpdateSpecialtyRequest).isActive ??
							specialty?.isActive
						}
						onChange={(e) => handleChange("isActive", e.target.checked)}
						className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label
						htmlFor="isActive"
						className="text-sm font-medium text-gray-700"
					>
						Active
					</label>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-3 border-t pt-6">
				<button
					type="button"
					onClick={onCancel}
					disabled={isPending}
					className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPending ? (
						<span className="flex items-center justify-center gap-2">
							<Icon icon="mdi:loading" className="animate-spin text-lg" />
							{isEditMode ? "Updating..." : "Creating..."}
						</span>
					) : (
						<span>{isEditMode ? "Update Specialty" : "Create Specialty"}</span>
					)}
				</button>
			</div>
		</form>
	);
};
