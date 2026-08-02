"use client";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { MedicalRecordForm } from "@/features/patient/components/MedicalRecordForm";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { Loading } from "@/shared/components/common/Loading";
import { ProtectedLayout } from "@/shared/components/layout/ProtectedLayout";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

export default function NewMedicalRecordPage() {
	const params = useParams();
	const router = useRouter();
	const patientId = params.id as string;

	const { usePatientById } = usePatient();
	const { data, isLoading, error, refetch } = usePatientById(patientId);

	const patient = data?.data;

	if (isLoading)
		return <Loading fullScreen text="Loading patient information..." />;
	if (error)
		return (
			<ErrorMessage
				message="Failed to load patient information"
				onRetry={refetch}
			/>
		);
	if (!patient) return <ErrorMessage message="Patient not found" />;

	// Permissions Check Removed
	return (
		<ProtectedLayout>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
					<div className="max-w-5xl mx-auto px-6 py-8">
						<button
							onClick={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
							className="mb-4 flex items-center gap-2 text-purple-100 hover:text-white transition-colors"
						>
							<Icon icon="mdi:arrow-left" width={20} />
							Back to Patient Profile
						</button>

						<div className="flex items-center gap-3">
							<div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
								<Icon icon="mdi:file-document-plus" width={32} />
							</div>
							<div>
								<h1 className="text-3xl font-bold">New Medical Record</h1>
								<p className="text-purple-100 mt-1">
									Patient: {patient.fullName} ({patient.patientCode})
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Form */}
				<div className="max-w-5xl mx-auto px-6 py-8">
					<MedicalRecordForm
						patientId={patientId}
						onSuccess={(record) => {
							toast.success("Medical record created successfully!");
							router.push(
								`${ROUTES.PATIENT_DETAIL(patientId)}/medical-records/${record.id}`,
							);
						}}
						onCancel={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
					/>
				</div>
			</div>
		</ProtectedLayout>
	);
}
