"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { logApiError } from "@/shared/lib/toast";

import { usePatient } from "../hooks/usePatient";
import type { Patient, MedicalRecord } from "../types/patient.type";

interface MedicalRecordFormProps {
	patientId: string;
	patient?: Patient;
	record?: MedicalRecord;
	onSuccess: (record: { id: string }) => void;
	onCancel: () => void;
}

type MedRow = {
	name: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions: string;
};

function emptyMed(): MedRow {
	return {
		name: "",
		dosage: "",
		frequency: "",
		duration: "",
		instructions: "",
	};
}

export function MedicalRecordForm({
	patientId,
	patient,
	record,
	onSuccess,
	onCancel,
}: MedicalRecordFormProps) {
	const isEdit = !!record;
	const {
		createMedicalRecord,
		updateMedicalRecord,
		isCreatingMedicalRecord,
		isUpdatingMedicalRecord,
	} = usePatient();

	const [visitDate, setVisitDate] = useState(
		record?.visitDate
			? record.visitDate.slice(0, 10)
			: new Date().toISOString().slice(0, 10),
	);
	const [chiefComplaint, setChiefComplaint] = useState(
		record?.chiefComplaint ?? "",
	);
	const [diagnosis, setDiagnosis] = useState(record?.diagnosis ?? "");
	const [treatment, setTreatment] = useState(record?.treatment ?? "");
	const [notes, setNotes] = useState(record?.notes ?? "");
	const [recordType, setRecordType] = useState(record?.recordType ?? "GENERAL");
	const [doctorName, setDoctorName] = useState(record?.doctorName ?? "");
	const [medications, setMedications] = useState<MedRow[]>(
		record?.prescription?.medications?.map((m) => ({
			name: m.name,
			dosage: m.dosage,
			frequency: m.frequency,
			duration: m.duration,
			instructions: m.instructions ?? "",
		})) ?? [],
	);
	const [prescriptionNotes, setPrescriptionNotes] = useState(
		record?.prescription?.instructions ?? "",
	);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const errs: Record<string, string> = {};
		if (!visitDate) errs.visitDate = "Please select a visit date";
		if (!diagnosis.trim()) errs.diagnosis = "Please enter a diagnosis";
		if (!treatment.trim()) errs.treatment = "Please enter the treatment";
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		const validMeds = medications.filter((m) => m.name.trim());

		const body: Record<string, unknown> = {
			patient_id: patientId,
			visit_date: visitDate,
			chief_complaint: chiefComplaint || undefined,
			diagnosis,
			treatment,
			notes: notes || undefined,
			record_type: recordType,
			doctor_name: doctorName || undefined,
			prescription:
				validMeds.length > 0 || prescriptionNotes
					? {
							medications: validMeds.map((m) => ({
								name: m.name,
								dosage: m.dosage,
								frequency: m.frequency,
								duration: m.duration,
								instructions: m.instructions || undefined,
							})),
							instructions: prescriptionNotes || undefined,
						}
					: undefined,
		};

		try {
			if (isEdit && record) {
				await updateMedicalRecord({ id: record.id, body });
				onSuccess({ id: record.id });
			} else {
				const result = await createMedicalRecord(body);
				onSuccess({ id: result.data.id });
			}
		} catch (err) {
			logApiError(err, "submit medical record form");
		}
	};

	const addMed = () => setMedications((m) => [...m, emptyMed()]);
	const removeMed = (idx: number) =>
		setMedications((m) => m.filter((_, i) => i !== idx));
	const updateMed = (idx: number, key: keyof MedRow, val: string) =>
		setMedications((m) =>
			m.map((row, i) => (i === idx ? { ...row, [key]: val } : row)),
		);

	const isPending = isCreatingMedicalRecord || isUpdatingMedicalRecord;

	const textarea = (
		label: string,
		val: string,
		onChange: (v: string) => void,
		required = false,
		errKey = "",
	) => (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
			<textarea
				rows={3}
				value={val}
				onChange={(e) => onChange(e.target.value)}
				className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none ${errors[errKey] ? "border-red-400" : "border-gray-200"}`}
			/>
			{errKey && errors[errKey] && (
				<p className="text-red-500 text-xs mt-1">{errors[errKey]}</p>
			)}
		</div>
	);

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Patient info banner */}
			{patient && (
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
					<Icon
						icon="mdi:account"
						width={24}
						className="text-blue-600 shrink-0"
					/>
					<div>
						<p className="font-medium text-blue-900">{patient.fullName}</p>
						<p className="text-sm text-blue-600">
							Patient code: {patient.patientCode}
						</p>
					</div>
				</div>
			)}

			{/* Visit Info */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
				<h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
					<Icon
						icon="mdi:calendar-check"
						width={22}
						className="text-blue-600"
					/>
					Visit Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Visit Date <span className="text-red-500">*</span>
						</label>
						<input
							type="date"
							value={visitDate}
							onChange={(e) => setVisitDate(e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.visitDate ? "border-red-400" : "border-gray-200"}`}
						/>
						{errors.visitDate && (
							<p className="text-red-500 text-xs mt-1">{errors.visitDate}</p>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Record Type
						</label>
						<select
							value={recordType}
							onChange={(e) => setRecordType(e.target.value)}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						>
							<option value="GENERAL">General</option>
							<option value="DENTAL">Dental</option>
							<option value="SPECIALIST">Specialist</option>
							<option value="EMERGENCY">Emergency</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Doctor
						</label>
						<input
							type="text"
							placeholder="Doctor name..."
							value={doctorName}
							onChange={(e) => setDoctorName(e.target.value)}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
					</div>
				</div>
			</div>

			{/* Clinical */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
				<h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
					<Icon icon="mdi:stethoscope" width={22} className="text-green-600" />
					Clinical
				</h3>
				<div className="space-y-4">
					{textarea(
						"Chief Complaint / Symptoms",
						chiefComplaint,
						setChiefComplaint,
					)}
					{textarea("Diagnosis", diagnosis, setDiagnosis, true, "diagnosis")}
					{textarea("Treatment", treatment, setTreatment, true, "treatment")}
					{textarea("Notes", notes, setNotes)}
				</div>
			</div>

			{/* Prescription */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
						<Icon icon="mdi:pill" width={22} className="text-red-600" />
						Prescription
					</h3>
					<button
						type="button"
						onClick={addMed}
						className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
					>
						<Icon icon="mdi:plus" width={16} />
						Add Medication
					</button>
				</div>

				{medications.length === 0 ? (
					<p className="text-sm text-gray-400 text-center py-4">
						No medications added yet
					</p>
				) : (
					<div className="space-y-4">
						{medications.map((med, idx) => (
							<div key={idx} className="border border-gray-200 rounded-lg p-4">
								<div className="flex justify-between items-start mb-3">
									<span className="text-sm font-medium text-gray-600">
										Medication #{idx + 1}
									</span>
									<button
										type="button"
										onClick={() => removeMed(idx)}
										className="text-red-400 hover:text-red-600 transition-colors"
									>
										<Icon icon="mdi:trash-can-outline" width={18} />
									</button>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									{(["name", "dosage", "frequency", "duration"] as const).map(
										(k) => (
											<div key={k}>
												<label className="block text-xs text-gray-500 mb-1 capitalize">
													{k === "name"
														? "Medication Name"
														: k === "dosage"
															? "Dosage"
															: k === "frequency"
																? "Frequency"
																: "Duration"}
												</label>
												<input
													type="text"
													value={med[k]}
													onChange={(e) => updateMed(idx, k, e.target.value)}
													className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
												/>
											</div>
										),
									)}
									<div className="col-span-2 md:col-span-4">
										<label className="block text-xs text-gray-500 mb-1">
											Instructions
										</label>
										<input
											type="text"
											value={med.instructions}
											onChange={(e) =>
												updateMed(idx, "instructions", e.target.value)
											}
											className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>
						))}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								General Prescription Notes
							</label>
							<textarea
								rows={2}
								value={prescriptionNotes}
								onChange={(e) => setPrescriptionNotes(e.target.value)}
								className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
							/>
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-end">
				<button
					type="button"
					onClick={onCancel}
					className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
				>
					{isPending && <Icon icon="line-md:loading-twotone-loop" width={18} />}
					{isEdit ? "Update Record" : "Create Record"}
				</button>
			</div>
		</form>
	);
}
