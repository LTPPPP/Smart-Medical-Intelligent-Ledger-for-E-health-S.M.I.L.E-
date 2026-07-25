"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { COMMON_ICD_CODES } from "@/features/examination/constants/icd";
import { useExamination } from "@/features/examination/hooks/useExamination";
import type {
	CreateDiagnosisRequest,
	DiagnosisSeverity,
} from "@/features/examination/types/examination.type";

interface DiagnosisFormProps {
	sessionId: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}

const SEVERITY_OPTIONS: {
	value: DiagnosisSeverity;
	label: string;
	color: string;
}[] = [
	{ value: "mild", label: "Mild", color: "bg-green-100 text-green-800" },
	{
		value: "moderate",
		label: "Moderate",
		color: "bg-yellow-100 text-yellow-800",
	},
	{ value: "severe", label: "Severe", color: "bg-orange-100 text-orange-800" },
	{ value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
];

export const DiagnosisForm = ({
	sessionId,
	onSuccess,
	onCancel,
}: DiagnosisFormProps) => {
	const { createDiagnosis, isCreatingDiagnosis } = useExamination();

	const [formData, setFormData] = useState<CreateDiagnosisRequest>({
		sessionId,
		icdCode: "",
		description: "",
		severity: "moderate",
		affectedTeeth: [],
		recommendedTreatment: "",
		notes: "",
	});

	const [toothInput, setToothInput] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.icdCode || !formData.description) {
			alert("Please fill in required fields");
			return;
		}

		try {
			await createDiagnosis(formData);
			onSuccess?.();
		} catch {
			alert("Failed to create diagnosis");
		}
	};

	const handleIcdSelect = (code: string, description: string) => {
		setFormData({
			...formData,
			icdCode: code,
			description: description,
		});
	};

	const handleAddTooth = () => {
		const toothNumber = parseInt(toothInput);
		if (toothNumber >= 11 && toothNumber <= 48) {
			if (!formData.affectedTeeth?.includes(toothNumber)) {
				setFormData({
					...formData,
					affectedTeeth: [...(formData.affectedTeeth || []), toothNumber],
				});
			}
			setToothInput("");
		}
	};

	const handleRemoveTooth = (tooth: number) => {
		setFormData({
			...formData,
			affectedTeeth: formData.affectedTeeth?.filter((t) => t !== tooth),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
			<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
				<Icon icon="mdi:file-document-edit" width={24} />
				Add Diagnosis
			</h3>

			{/* ICD-10 Code */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">
					ICD-10 Code <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					value={formData.icdCode}
					onChange={(e) =>
						setFormData({ ...formData, icdCode: e.target.value })
					}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="K02.1"
					required
				/>

				{/* Quick Select Common Codes */}
				<div className="mt-2">
					<p className="text-xs text-gray-500 mb-2">Common codes:</p>
					<div className="flex flex-wrap gap-2">
						{COMMON_ICD_CODES.map((icd) => (
							<button
								key={icd.code}
								type="button"
								onClick={() => handleIcdSelect(icd.code, icd.description)}
								className="text-xs px-2 py-1 border rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
							>
								{icd.code}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Description */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">
					Description <span className="text-red-500">*</span>
				</label>
				<textarea
					value={formData.description}
					onChange={(e) =>
						setFormData({ ...formData, description: e.target.value })
					}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					rows={3}
					placeholder="Detailed diagnosis description..."
					required
				/>
			</div>

			{/* Severity */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">Severity</label>
				<div className="flex gap-2">
					{SEVERITY_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() =>
								setFormData({ ...formData, severity: option.value })
							}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								formData.severity === option.value
									? option.color
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Affected Teeth */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">
					Affected Teeth (FDI)
				</label>
				<div className="flex gap-2 mb-2">
					<input
						type="number"
						min="11"
						max="48"
						value={toothInput}
						onChange={(e) => setToothInput(e.target.value)}
						onKeyPress={(e) =>
							e.key === "Enter" && (e.preventDefault(), handleAddTooth())
						}
						className="flex-1 border rounded-lg px-3 py-2"
						placeholder="Enter tooth number (11-48)"
					/>
					<button
						type="button"
						onClick={handleAddTooth}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Add
					</button>
				</div>

				{formData.affectedTeeth && formData.affectedTeeth.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{formData.affectedTeeth
							.sort((a, b) => a - b)
							.map((tooth) => (
								<span
									key={tooth}
									className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
								>
									Tooth {tooth}
									<button
										type="button"
										onClick={() => handleRemoveTooth(tooth)}
										className="text-blue-600 hover:text-blue-800"
									>
										<Icon icon="mdi:close" width={16} />
									</button>
								</span>
							))}
					</div>
				)}
			</div>

			{/* Recommended Treatment */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">
					Recommended Treatment
				</label>
				<textarea
					value={formData.recommendedTreatment}
					onChange={(e) =>
						setFormData({ ...formData, recommendedTreatment: e.target.value })
					}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					rows={3}
					placeholder="Suggested treatment plan..."
				/>
			</div>

			{/* Notes */}
			<div className="mb-6">
				<label className="block text-sm font-medium mb-2">
					Additional Notes
				</label>
				<textarea
					value={formData.notes}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					rows={2}
					placeholder="Any additional notes..."
				/>
			</div>

			{/* Actions */}
			<div className="flex gap-2 justify-end">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isCreatingDiagnosis}
					className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
				>
					{isCreatingDiagnosis && (
						<Icon icon="line-md:loading-twotone-loop" width={20} />
					)}
					Add Diagnosis
				</button>
			</div>
		</form>
	);
};
