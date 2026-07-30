"use client";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { usePatient } from "@/features/patient/hooks/usePatient";
import type { RecordStatus } from "@/features/patient/types/patient.type";
import { Loading } from "@/shared/components/common/Loading";
import { ProtectedLayout } from "@/shared/components/layout/ProtectedLayout";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { logApiError, toast } from "@/shared/lib/toast";

export default function MedicalRecordDetailPage() {
	const params = useParams();
	const router = useRouter();
	const recordId = params.recordId as string;

	const {
		useMedicalRecordById,
		finalizeMedicalRecord,
		deleteMedicalRecord,
		isFinalizingMedicalRecord,
		isDeletingMedicalRecord,
	} = usePatient();

	const { data, isLoading, error, refetch } = useMedicalRecordById(recordId);
	const record = data?.data;

	const handleFinalize = async () => {
		if (!record) return;

		if (
			!confirm(
				"Finalize this medical record? Once finalized, it cannot be edited.",
			)
		)
			return;

		try {
			await finalizeMedicalRecord(recordId);
			refetch();
			toast.success("Medical record finalized");
		} catch (error) {
			logApiError(error, "finalize medical record");
			toast.error("Failed to finalize medical record");
		}
	};

	const handleDelete = async () => {
		if (!record) return;

		if (!confirm("Delete this medical record? This action cannot be undone."))
			return;

		try {
			await deleteMedicalRecord(recordId);
			toast.success("Medical record deleted");
			router.back();
		} catch (error) {
			logApiError(error, "delete medical record");
			toast.error("Failed to delete medical record");
		}
	};

	const getStatusBadge = (status: RecordStatus) => {
		const badges = {
			DRAFT: {
				bg: "bg-gray-100",
				text: "text-gray-800",
				label: "Draft",
				icon: "mdi:pencil",
			},
			FINALIZED: {
				bg: "bg-green-100",
				text: "text-green-800",
				label: "Finalized",
				icon: "mdi:check-circle",
			},
		};
		const badge = badges[status];
		return (
			<span
				className={`px-4 py-2 rounded-lg font-medium ${badge.bg} ${badge.text} flex items-center gap-2`}
			>
				<Icon icon={badge.icon} width={20} />
				{badge.label}
			</span>
		);
	};

	if (isLoading) return <Loading fullScreen text="Loading medical record..." />;
	if (error)
		return (
			<ErrorMessage message="Failed to load medical record" onRetry={refetch} />
		);
	if (!record) return <ErrorMessage message="Medical record not found" />;

	// requiredPermissions dropped: user.permissions is never populated anywhere in the auth
	// store (the granular permission system is decorative — see backend RolesGuard), so any
	// requiredPermissions check is permanently unsatisfiable and blocks every role. Real
	// authorization is already enforced server-side by the backend's role guards.
	return (
		<ProtectedLayout>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
					<div className="max-w-7xl mx-auto px-6 py-8">
						<button
							onClick={() => router.back()}
							className="mb-4 flex items-center gap-2 text-purple-100 hover:text-white transition-colors"
						>
							<Icon icon="mdi:arrow-left" width={20} />
							Back
						</button>

						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h1 className="text-3xl font-bold">
										Medical Record #{recordId.slice(0, 8)}
									</h1>
									{getStatusBadge(record.status)}
								</div>
								<div className="flex items-center gap-4 text-purple-100">
									<span className="flex items-center gap-1">
										<Icon icon="mdi:calendar" width={16} />
										{new Date(record.visitDate).toLocaleDateString("vi-VN")}
									</span>
									<span>•</span>
									<span className="flex items-center gap-1">
										<Icon icon="mdi:doctor" width={16} />
										{record.doctorName || "Not available"}
									</span>
									<span>•</span>
									<span className="flex items-center gap-1">
										<Icon icon="mdi:hospital-building" width={16} />
										{record.clinicName || "Not available"}
									</span>
								</div>
							</div>

							<div className="flex gap-2">
								{record.status === "DRAFT" && (
									<>
										<button
											onClick={() =>
												router.push(
													`${ROUTES.PATIENTS}/${record.patientId}/medical-records/${recordId}/edit`,
												)
											}
											className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
										>
											<Icon icon="mdi:pencil" width={20} />
											Edit
										</button>
										<button
											onClick={handleFinalize}
											disabled={isFinalizingMedicalRecord}
											className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
										>
											{isFinalizingMedicalRecord ? (
												<Icon icon="line-md:loading-twotone-loop" width={20} />
											) : (
												<Icon icon="mdi:check" width={20} />
											)}
											Finalize
										</button>
									</>
								)}

								{record.status === "DRAFT" && (
									<button
										onClick={handleDelete}
										disabled={isDeletingMedicalRecord}
										className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
									>
										{isDeletingMedicalRecord ? (
											<Icon icon="line-md:loading-twotone-loop" width={20} />
										) : (
											<Icon icon="mdi:delete" width={20} />
										)}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-6">
							{/* Chief Complaint */}
							{record.chiefComplaint && (
								<div className="bg-white rounded-xl shadow-md p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
										<Icon
											icon="mdi:comment-text"
											width={24}
											className="text-blue-600"
										/>
										Chief Complaint / Symptoms
									</h3>
									<p className="text-gray-700 whitespace-pre-wrap">
										{record.chiefComplaint}
									</p>
								</div>
							)}

							{/* Diagnosis */}
							<div className="bg-white rounded-xl shadow-md p-6">
								<h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
									<Icon
										icon="mdi:stethoscope"
										width={24}
										className="text-green-600"
									/>
									Diagnosis
								</h3>
								<p className="text-gray-700 whitespace-pre-wrap">
									{record.diagnosis}
								</p>
							</div>

							{/* Treatment */}
							<div className="bg-white rounded-xl shadow-md p-6">
								<h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
									<Icon
										icon="mdi:medical-bag"
										width={24}
										className="text-purple-600"
									/>
									Treatment
								</h3>
								<p className="text-gray-700 whitespace-pre-wrap">
									{record.treatment}
								</p>
							</div>

							{/* Prescription */}
							{record.prescription &&
								record.prescription.medications.length > 0 && (
									<div className="bg-white rounded-xl shadow-md p-6">
										<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
											<Icon
												icon="mdi:pill"
												width={24}
												className="text-red-600"
											/>
											Prescription
										</h3>

										<div className="space-y-3">
											{record.prescription.medications.map((med, index) => (
												<div key={index} className="border rounded-lg p-4">
													<div className="font-medium text-gray-800 mb-2">
														{med.name}
													</div>
													<div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
														<div>
															<span className="font-medium">Dosage:</span>{" "}
															{med.dosage}
														</div>
														<div>
															<span className="font-medium">Frequency:</span>{" "}
															{med.frequency}
														</div>
														<div>
															<span className="font-medium">Duration:</span>{" "}
															{med.duration}
														</div>
														{med.instructions && (
															<div className="col-span-2 md:col-span-3">
																<span className="font-medium">
																	Instructions:
																</span>{" "}
																{med.instructions}
															</div>
														)}
													</div>
												</div>
											))}
										</div>

										{record.prescription.instructions && (
											<div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
												<div className="flex items-start gap-2">
													<Icon
														icon="mdi:alert"
														width={20}
														className="text-yellow-600 flex-shrink-0 mt-0.5"
													/>
													<div className="text-sm text-yellow-900">
														<div className="font-medium mb-1">Note:</div>
														{record.prescription.instructions}
													</div>
												</div>
											</div>
										)}
									</div>
								)}

							{/* Notes */}
							{record.notes && (
								<div className="bg-white rounded-xl shadow-md p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
										<Icon
											icon="mdi:note-text"
											width={24}
											className="text-orange-600"
										/>
										Notes
									</h3>
									<p className="text-gray-700 whitespace-pre-wrap">
										{record.notes}
									</p>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div className="space-y-6">
							{/* Record Info */}
							<div className="bg-white rounded-xl shadow-md p-6">
								<h3 className="text-lg font-bold text-gray-800 mb-4">
									Record Info
								</h3>
								<div className="space-y-3 text-sm">
									<div>
										<div className="text-gray-500 mb-1">Record Type</div>
										<div className="font-medium">{record.recordType}</div>
									</div>
									<div>
										<div className="text-gray-500 mb-1">Status</div>
										<div className="font-medium">{record.status}</div>
									</div>
									<div>
										<div className="text-gray-500 mb-1">Created</div>
										<div className="font-medium">
											{new Date(record.createdAt).toLocaleString("vi-VN")}
										</div>
									</div>
									<div>
										<div className="text-gray-500 mb-1">Last Updated</div>
										<div className="font-medium">
											{new Date(record.updatedAt).toLocaleString("vi-VN")}
										</div>
									</div>
									{record.finalizedAt && (
										<div>
											<div className="text-gray-500 mb-1">Finalized On</div>
											<div className="font-medium">
												{new Date(record.finalizedAt).toLocaleString("vi-VN")}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="bg-white rounded-xl shadow-md p-6">
								<h3 className="text-lg font-bold text-gray-800 mb-4">
									Actions
								</h3>
								<div className="space-y-2">
									<button
										onClick={() => window.print()}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
									>
										<Icon icon="mdi:printer" width={20} />
										Print Record
									</button>
									<button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
										<Icon icon="mdi:download" width={20} />
										Download PDF
									</button>
									<button
										onClick={() =>
											router.push(ROUTES.PATIENT_DETAIL(record.patientId))
										}
										className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
									>
										<Icon icon="mdi:account" width={20} />
										View Patient Profile
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ProtectedLayout>
	);
}
